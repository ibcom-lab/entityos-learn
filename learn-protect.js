/*
	LEARN; Protecting data stored in entityos.cloud using crytography.

    It uses the NodeJS Crypto module, which is a wrapper for openSSL encryption functions.

	Also see learn.js for more example code using the entityos node module.

	Crypto references:

	# 7 Cryptography Concepts EVERY Developer Should Know;
        - Video: https://www.youtube.com/watch?v=NuyzuNBFWxQ&list=PLCLDLvJ_h02In9NfVL5evtpKQTXojC049&index=6
        - Code: https://github.com/fireship-io/node-crypto-examples
    
    # NodeJS Crypto refence:
        - Full: https://nodejs.org/api/crypto.html 
        - Usage: https://nodejs.org/api/synopsis.html

    # Online Hashing:
    https://emn178.github.io/online-tools/sha256.html

    To run it on your local computer your need to install:

	https://www.npmjs.com/package/lambda-local:

	And then run as:

    # all:
	lambda-local -l learn-protect.js -t 9000 -e learn-event-protect.json 

    # hash
    lambda-local -l learn-protect.js -t 9000 -e learn-event-protect-hash.json 

    # protect-create-keys:
    lambda-local -l learn-protect.js -t 9000 -e learn-event-protect-create-keys.json

    lambda-local -l learn-protect.js -t 9000 -e learn-event-protect-using-algorithm-encrypt-rsa-private-pem.json
    lambda-local -l learn-protect.js -t 9000 -e learn-event-protect-using-algorithm-decrypt-rsa-public-pem.json

    lambda-local -l learn-protect.js -t 9000 -e learn-event-protect-using-algorithm-encrypt-rsa-private-pem-foundation-community.json

    lambda-local -l learn-protect.js -t 9000 -e learn-event-protect-encrypt.json
    lambda-local -l learn-protect.js -t 9000 -e learn-event-protect-decrypt.json

    - where the data in event.json will be passed to the handler as event and the settings.json data will passed as context.
	
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
                const { createHash, publicDecrypt, privateDecrypt } = require('crypto');

                var event = entityos.get({ scope: '_event'});

                if (event.hashMethod == undefined)
                {
                    event.hashMethod = 'sha256'
                }

                if (event.output == undefined)
                {
                    event.output = 'base64'
                }

                if (event.text == undefined && event.data != undefined)
                {
                    event.text = JSON.stringify(event.data);
                    if (event.escape)
                    {
                        event.text = _.escape(event.text);
                    }
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

                if (event.keyMethod == undefined) // 'rsa', ed25519
                {
                    event.keyMethod = 'rsa'
                }

                if (event.keyLength == undefined && event.keyMethod == 'rsa')
                {
                    event.keyLength = 2048
                }

                if (event.format == undefined) //'pem', 'der', 'jwk'
                {
                    event.format = 'pem'
                }

                if (event.output == undefined && (event.format == 'der' || event.format == 'jwk'))
                {
                    //event.output = 'base64' // 'hex'
                }

                if (event.keyPublicType == undefined)
                {
                    event.keyPublicType = 'spki' // recommended to be 'spki' by the Node.js docs
                }

                if (event.keyPrivateTypee == undefined)
                {
                    event.keyPrivateType = 'pkcs8' // recommended to be 'pkcs8' by the Node.js docs
                }

                const { privateKey, publicKey } = generateKeyPairSync(event.keyMethod,
                {
                    modulusLength: event.keyLength,
                    publicKeyEncoding:
                    {
                        type: event.keyPublicType,
                        format: event.format,
                    },
                    privateKeyEncoding:
                    {
                        type: event.keyPrivateType,
                        format: event.format,
                        cipher: event.keyCipher, // eg 'aes-256-cbc'
                        passphrase: event.keyCipherSecret 
                    },
                });
                  
                if (event.output == undefined)
                {
                    event.keyPrivate = privateKey;
                    event.keyPublic = publicKey;
                }
                else
                {
                    if (event.format == 'jwk')
                    {
                        event.keyPrivate = Buffer.from(JSON.stringify(privateKey)).toString(event.output);
                        event.keyPublic = Buffer.from(JSON.stringify(publicKey)).toString(event.output);
                    }
                    else
                    {
                        event.keyPrivate = privateKey.toString(event.output);
                        event.keyPublic = publicKey.toString(event.output);
                    }
                }

                entityos.invoke('util-end', event);     
            }
        });

        entityos.add(
        {
            name: 'util-protect-encrypt',
            notes: 'Using shared key.',
            code: function ()
            {
                const { createCipheriv, randomBytes } = require('crypto');

                var event = entityos.get({ scope: '_event'});

                if (event.keyFormat == undefined)
                {
                    event.keyFormat = 'hex'
                }

                if (event.keyPrivate == undefined)
                {
                    event._keyPrivate = randomBytes(32);
                    event.keyPrivate = event._keyPrivate.toString(event.keyFormat);
                }
                else
                {
                    event._keyPrivate = new Buffer.from(event.keyPrivate,  event.keyFormat);
                }

                if (event.initialisationVector == undefined)
                {
                    event._initialisationVector = randomBytes(16);
                    event.initialisationVector = event._initialisationVector.toString(event.keyFormat);
                }
                else
                {
                    event._initialisationVector = new Buffer.from(event.initialisationVector, event.keyFormat);
                }

                if (event.encryptionMethod == undefined)
                {
                    event.encryptionMethod = 'aes256'
                }

                const cipher = createCipheriv(event.encryptionMethod, event._keyPrivate, event._initialisationVector);

                if (event.output == undefined)
                {
                    event.output = 'hex' // 'base64'
                }

                if (event.text == undefined && event.data != undefined)
                {
                    event._text = JSON.stringify(event.data);
                    event.text = _.escape(event._text);
                }

                event.textEncrypted = cipher.update(event.text, 'utf8', event.output) + cipher.final(event.output);

                entityos.invoke('util-end', event);     
            }
        });
    
        entityos.add(
        {
            name: 'util-protect-decrypt',
            notes: 'Using shared key.',
            code: function ()
            {
                const { createDecipheriv, randomBytes } = require('crypto');

                var event = entityos.get({ scope: '_event'});

                if (event.keyFormat == undefined)
                {
                    event.keyFormat = 'hex'
                }

                event._keyPrivate = new Buffer.from(event.keyPrivate, event.keyFormat);
                event._initialisationVector = new Buffer.from(event.initialisationVector, event.keyFormat);
                
                if (event.encryptionMethod == undefined)
                {
                    event.encryptionMethod = 'aes256'
                }

                const decipher = createDecipheriv(event.encryptionMethod, event._keyPrivate, event._initialisationVector);

                if (event.input == undefined)
                {
                    event.input = 'hex' // 'base64'
                }

                if (event.output == undefined)
                {
                    event.output = 'utf8'
                }

                event.textDecrypted = decipher.update(event.text, event.input, event.output) + decipher.final(event.output);

                entityos.invoke('util-end', event);     
            }
        });

        entityos.add(
        {
            name: 'util-protect-sign',
            notes: 'Use method: util-protect-keys if want to pre-create keys',
            code: function ()
            {
                const { createSign, createVerify } = require('crypto');
                const { generateKeyPairSync } = require('crypto');

                var event = entityos.get({ scope: '_event'});

                if (event.keyLength == undefined)
                {
                    event.keyLength = 2048
                }

                event.keyPublicType = 'spki' // recommended to be 'spki' by the Node.js docs
                event.keyPrivateType = 'pkcs8' // recommended to be 'spki' by the Node.js docs

                if (event.privateKey == undefined || event.publicKey == undefined)
                {
                    const { privateKey, publicKey } = generateKeyPairSync('rsa',
                    {
                        modulusLength: event.keyLength,
                        publicKeyEncoding:
                        {
                            type: event.keyPublicType,
                            format: 'pem',
                        },
                        privateKeyEncoding:
                        {
                            type: event.keyPrivateType,
                            format: 'pem'
                        },
                    });

                    event.privateKey = privateKey;
                    event.publicKey = publicKey;
                }

                const signer = createSign('rsa-sha256');
                signer.update(event.text);
                event.textSignature = signer.sign(privateKey, 'hex');

                entityos.invoke('util-end', event);     
            }
        });

        entityos.add(
        {
            name: 'util-protect-using-algorithm-encrypt',
            notes: 'Using private/public keys and algorithm.',
            code: function ()
            {
                const { publicEncrypt, privateEncrypt } = require('crypto');
                const { generateKeyPairSync } = require('crypto');

                var event = entityos.get({ scope: '_event'});

                if (event.input == undefined) // 'hex', 'base64', 'utf-8'
                {
                    event.input = 'utf-8'
                }

                if (event.output == undefined) // 'hex', 'base64'
                {
                    event.output = 'base64'
                }

                if (event.format == undefined) //'pem', 'der', 'jwk'
                {
                    event.format = 'pem'
                }

                if (event.keyMethod == undefined) // rsa/ed25519
                {
                    event.keyMethod = 'rsa'
                }

                if (event.keyPrivate == undefined && event.keyPublic == undefined)
                {
                    event.keyPublicType = 'spki' // recommended to be 'spki' by the Node.js docs
                    event.keyPrivateType = 'pkcs8' // recommended to be 'spki' by the Node.js docs

                    if (event.keyLength == undefined)
                    {
                        event.keyLength = 2048
                    }

                    const { privateKey, publicKey } = generateKeyPairSync(event.keyMethod,
                    {
                        modulusLength: event.keyLength,
                        publicKeyEncoding:
                        {
                            type: event.keyPublicType,
                            format: event.format,
                        },
                        privateKeyEncoding:
                        {
                            type: event.keyPrivateType,
                            format: event.format
                        }
                    });

                    event._keyPrivate = privateKey.toString(event.output);
                    event._keyPublic = publicKey.toString(event.output);             
                }
                else
                {
                    if (event.keyPrivate != undefined)
                    {
                        if (!_.includes(event.keyPrivate,'-----BEGIN PRIVATE KEY-----'))
                        {
                            event.keyPrivate = '-----BEGIN PRIVATE KEY-----\n' + event.keyPrivate;
                        }

                        if (!_.includes(event.keyPrivate,'-----END PRIVATE KEY-----'))
                        {
                            event.keyPrivate = event.keyPrivate + '\n-----END PRIVATE KEY-----\n';
                        }

                        event._keyPrivate = new Buffer.from(event.keyPrivate, event.input);
                    }

                    if (event.keyPublic != undefined)
                    {
                         if (!_.includes(event.keyPublic,'-----BEGIN PUBLIC KEY-----'))
                        {
                            event.keyPublic = '-----BEGIN PUBLIC KEY-----\n' + event.keyPublic;
                        }

                        if (!_.includes(event.keyPublic,'-----END PUBLIC KEY-----'))
                        {
                            event.keyPublic = event.keyPublic + '\n-----END PUBLIC KEY-----\n';
                        }

                        event._keyPublic = new Buffer.from(event.keyPublic, event.input);
                    }
                }

                //entityos.invoke('util-end', event);   

                if (event.text == undefined && event.data != undefined)
                {
                    event.text = JSON.stringify(event.data);
                    //event.text = _.escape(event._text);
                }

                //entityos.invoke('util-end', event.text);

                if (event._keyPrivate != undefined)
                {
                    event.textEncrypted = privateEncrypt(
                        event._keyPrivate,
                        Buffer.from(event.text)
                    ).toString(event.output);

                    event.encryptedUsingPrivateKey = true;
                }
                else if (event._keyPublic != undefined)
                {
                    event.textEncrypted = publicEncrypt(
                        event._keyPublic,
                        Buffer.from(event.text)
                    ).toString(event.output);

                    event.encryptedUsingPublicKey = true;
                }

                entityos.invoke('util-end', event);     
            }
        });

        entityos.add(
        {
            name: 'util-protect-using-algorithm-decrypt',
            notes: 'Using private/public keys and algorithm.',
            code: function ()
            {
                const { publicDecrypt, privateDecrypt } = require('crypto');

                var event = entityos.get({ scope: '_event'});

                if (event.keyPublic != undefined)
                {
                    event._keyPublic = event.keyPublic;

                    if (!_.includes(event._keyPublic,'-----BEGIN PUBLIC KEY-----'))
                    {
                        event._keyPublic = '-----BEGIN PUBLIC KEY-----\n' + event._keyPublic;
                    }

                    if (!_.includes(event._keyPublic,'-----END PUBLIC KEY-----'))
                    {
                        event._keyPublic = event._keyPublic + '\n-----END PUBLIC KEY-----\n';
                    }
                }

                if (event.keyPrivate != undefined)
                {
                    event._keyPrivate = event.keyPrivate;

                    if (!_.includes(event._keyPrivate,'-----BEGIN PRIVATE KEY-----'))
                    {
                        event._keyPrivate = '-----BEGIN PRIVATE KEY-----\n' + event._keyPrivate;
                    }

                    if (!_.includes(event._keyPrivate,'-----END PRIVATE KEY-----'))
                    {
                        event._keyPrivate = event._keyPrivate + '\n-----END PRIVATE KEY-----\n';
                    }
                } 

                if (event._keyPublic != undefined)
                {               
                    event.textDecrypted = publicDecrypt(
                        event._keyPublic,
                        Buffer.from(event.textEncrypted, 'base64')
                    ).toString('utf-8');

                    event.decryptedUsingPublicKey = true;
                }
                else if (event._keyPrivate != undefined)
                {
                    event.textDecrypted = privateDecrypt(
                        event._keyPrivate,
                        Buffer.from(event.textEncrypted, 'base64')
                    ).toString('utf-8');

                    event.decryptedUsingPrivateKey = true;
                }
                
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