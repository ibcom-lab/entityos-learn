/*
	LEARN; Protecting data stored in entityos.cloud using crytography.

    It uses the NodeJS Crypto module, which is a wrapper for openSSL encryption functions.

	To run it on your local computer your need to install:

	https://www.npmjs.com/package/lambda-local:

	And then run as:

	lambda-local -l learn-protect.js -t 9000 -e learn-event-protect.json

	- where the data in event.json will be passed to the handler as event and the settings.json data will passed as context.

	Also see learn.js for more example code using the entityos node module.

	Crypto references:

	# 7 Cryptography Concepts EVERY Developer Should Know;
        - Video: https://www.youtube.com/watch?v=NuyzuNBFWxQ&list=PLCLDLvJ_h02In9NfVL5evtpKQTXojC049&index=6
        - Code: https://github.com/fireship-io/node-crypto-examples
    
    # NodeJS Crypto refence:
        - Full: https://nodejs.org/api/crypto.html 
        - Usage: https://nodejs.org/api/synopsis.html
	
*/

const { appendFile } = require('fs');

exports.handler = function (event, context, callback)
{
	var entityos = require('entityos')
	var _ = require('lodash')
	var moment = require('moment');

	/*
		[LEARN #1]
		Store the event data and callback for use by controllers later.
	*/

    entityos.set(
    {
        scope: '_event',
        value: event
    });

	entityos.set(
    {
        scope: '_callback',
        value: callback
    });

    //entityos.init(main); // For interacting with entityos.cloud, if/when needed.
    main();

    function main(err, data)
    {
        /*
            [LEARN #1]

            This example shows the use of crypto functions to protect data.
        */

        entityos.add(
        {
            name: 'learn-protect-init',
            code: function ()
            {
                console.log('Using entityos module version ' + entityos.VERSION);
                //console.log(entityos.data.session);

                var event = entityos.get({ scope: '_event'});

                if (event.method == undefined)
                {
                    event.method = 'util-protect-hash';
                }

                entityos.invoke(event.method);
                
            }
        });

        entityos.add(
        {
            name: 'util-protect-hash',
            code: function ()
            {
                const { createHash } = require('crypto');

                var event = entityos.get({ scope: '_event'});

                if (event.hashMethod == undefined)
                {
                    event.hashMethod = 'sha256'
                }

                if (event.output == undefined)
                {
                    event.output = 'base64'
                }

                event.textHashed = createHash(event.hashMethod).update(event.text).digest(event.output);

                entityos.invoke('util-end', event);     
            }
        });

        entityos.add(
        {
            name: 'util-protect-hash-with-key',
            code: function ()
            {
                const { createHmac } = require('crypto');

                var event = entityos.get({ scope: '_event'});

                if (event.hashMethod == undefined)
                {
                    event.hashMethod = 'sha256'
                }

                if (event.output == undefined)
                {
                    event.output = 'base64'
                }

                event.textHashedWithKey = createHmac(event.hashMethod, event.keyPrivate).update(event.text).digest(event.output);

                entityos.invoke('util-end', event);     
            }
        });

        entityos.add(
        {
            name: 'util-protect-hash-with-salt',
            code: function ()
            {
                //LEARN; Let's add some salt to mix it up a bit

                const { scryptSync, randomBytes, timingSafeEqual } = require('crypto');

                var event = entityos.get({ scope: '_event'});

                if (event.output == undefined)
                {
                    event.output = 'hex' // 'base64'
                }

                event.salt = randomBytes(16).toString('hex');
                event.textHashedWithSalt = scryptSync(event.text,  event.salt, 64).toString(event.output);

                entityos.invoke('util-end', event);     
            }
        });

        entityos.add(
        {
            name: 'util-protect-create-keys',
            code: function ()
            {
                const { generateKeyPairSync } = require('crypto');

                var event = entityos.get({ scope: '_event'});

                if (event.keyMethod == undefined)
                {
                    event.keyMethod = 'rsa'
                }

                if (event.keyLength == undefined)
                {
                    event.keyLength = 2048
                }

                if (event.output == undefined)
                {
                    event.output = 'base64'
                }

                event.keyPublicType = 'spki' // recommended to be 'spki' by the Node.js docs
                event.keyPrivateType = 'pkcs8' // recommended to be 'spki' by the Node.js docs

                const { privateKey, publicKey } = generateKeyPairSync(event.keyMethod,
                {
                    modulusLength: event.keyLength, // the length of your key in bits
                    publicKeyEncoding:
                    {
                        type: event.keyPublicType,
                        format: 'pem',
                    },
                    privateKeyEncoding:
                    {
                        type: event.keyPrivateType,
                        format: 'pem',
                        cipher: event.keyCipher // 'aes-256-cbc',
                        // passphrase: event.keyCipherSecret // 'top secret'
                    },
                });
                  
                event.keyPrivate = privateKey;
                event.keyPublic = publicKey;

                entityos.invoke('util-end', event);     
            }
        });

        entityos.add(
        {
            name: 'util-protect-encrypt',
            code: function ()
            {
                const { createCipheriv, randomBytes } = require('crypto');

                var event = entityos.get({ scope: '_event'});

                if (event.keyPrivate == undefined)
                {
                    event.keyPrivate = randomBytes(32);
                }

                if (event.initialisationVector == undefined)
                {
                    event.initialisationVector = randomBytes(16);
                }

                event.iv =  event.initialisationVector.toString('hex');
                event.key =  event.keyPrivate.toString('hex');

                if (event.encryptionMethod == undefined)
                {
                    event.encryptionMethod = 'aes256'
                }

                const cipher = createCipheriv(event.encryptionMethod, event.keyPrivate, event.initialisationVector);

                if (event.output == undefined)
                {
                    event.output = 'hex' // 'base64'
                }

                event.textEncrypted = cipher.update(event.text, 'utf8', event.output) + cipher.final(event.output);

                entityos.invoke('util-end', event);     
            }
        });
    
        entityos.add(
        {
            name: 'util-protect-decrypt',
            code: function ()
            {
                const { createDecipheriv, randomBytes } = require('crypto');

                var event = entityos.get({ scope: '_event'});

                event._keyPrivate = new Buffer.from(event.keyPrivate, 'hex');
                event._initialisationVector = new Buffer.from(event.initialisationVector, 'hex');
                
                if (event.encryptionMethod == undefined)
                {
                    event.encryptionMethod = 'aes256'
                }

                const decipher = createDecipheriv(event.encryptionMethod, event._keyPrivate, event._initialisationVector);

                if (event.output == undefined)
                {
                    event.output = 'hex' // 'base64'
                }

                event.textDecrypted = decipher.update(event.text, event.output, 'utf8') + decipher.final('utf8');

                entityos.invoke('util-end', event);     
            }
        });

        entityos.add(
        {
            name: 'util-protect-sign',
            code: function ()
            {
                const { createSign, createVerify } = require('crypto');
                const { publicKey, privateKey } = require('./keypair');

                var event = entityos.get({ scope: '_event'});

                /*const signer = createSign('rsa-sha256');

                signer.update(message);

                const signature = signer.sign(privateKey, 'hex');


                event._keyPrivate = new Buffer.from(event.keyPrivate, 'hex');
                event._initialisationVector = new Buffer.from(event.initialisationVector, 'hex');
                
                if (event.encryptionMethod == undefined)
                {
                    event.encryptionMethod = 'aes256'
                }

                const decipher = createDecipheriv(event.encryptionMethod, event._keyPrivate, event._initialisationVector);

                if (event.output == undefined)
                {
                    event.output = 'hex' // 'base64'
                }

                event.textDecrypted = decipher.update(event.text, event.output, 'utf8') + decipher.final('utf8');
                */

                entityos.invoke('util-end', event);     
            }
        });

        entityos.add(
        {
            name: 'util-end',
            code: function (data, error)
            {
                var callback = entityos.get(
                {
                    scope: '_callback'
                });

                if (error == undefined) {error = null}

                if (callback != undefined)
                {
                    callback(error, data);
                }
            }
        });

        //STARTS HERE!
        entityos.invoke('learn-protect-init');
    }     


}