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

                if (event.hash == undefined)
                {
                    event.hash = 'sha256'
                }

                if (event.output == undefined)
                {
                    event.output = 'base64'
                }

                var textHashed = createHash(event.hash).update(event.text).digest(event.output);

                console.log('util-protect-hash:' + event.hash + ':' + event.output + ':');
                entityos.invoke('util-end',
                {
                    context: 'util-protect-hash:' + event.hash + ':' + event.output,
                    text: event.text,
                    textHashed: textHashed
                });     
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