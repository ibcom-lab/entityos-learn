/*
	LEARN; UPLOAD FILE TO entityos.cloud.

	To run it on your local computer your need to install:

	https://www.npmjs.com/package/lambda-local:

	And then run as:

	lambda-local -l learn-util.js -t 9000 -e learn-event-util-generate-random-text.json

	- where the data in event.json will be passed to the handler as event and the settings.json data will passed as context.

	Also see learn.js for more example code using the entityos node module.
*/

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

    //entityos.init(main)
	main();

    function main(err, data)
    {
        /*
			[LEARN #1]

			Util functions

			- Generate Random Text
        */

        entityos.add(
        {
            name: 'learn-util-init',
            code: function ()
            {
                entityos._util.message('Using entityos module version ' + entityos.VERSION);
                entityos._util.message(entityos.data.session);

				const event = entityos.get({scope: '_event'});
				const options = _.get(event, 'options', {})

                entityos.invoke(event.method, options);
            }
        });

        entityos.add(
        {
            name: 'learn-util-generate-random-text',
            code: function (param)
            {
				const randomText = entityos._util.generateRandomText(param)
				entityos.invoke('util-end', {randomtext: randomText});
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

        entityos.invoke('learn-util-init');
    }     
}