/*
	LEARN; Storaging files on storage services.
    e.g iagon.com

 	Also see learn.js for more example code using the entityos node module.

	References:

	# https://buildingoncardano.dev
    
    To run it on your local computer your need to install:

	https://www.npmjs.com/package/lambda-local:

	And then run as:

    # all:
	lambda-local -l learn-storage.js -t 9000 -e learn-event-storage-usage.json 

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

    //entityos.init(main);
	// For interacting with entityos.cloud, if/when needed.
    main();

    function main(err, data)
    {
		/*
			[LEARN #2]

			This example shows how to get file storage from iagon API.
		*/

		entityos.add(
		{
			name: 'learn-storage-init',
			code: function ()
			{
				console.log('Using entityos module version ' + entityos.VERSION);

				var event = entityos.get({ scope: '_event' });

				if (event.method == undefined) {
					event.method = 'learn-storage-usage';
				}

				entityos.invoke(event.method);
			}
		});

		entityos.add(
		{
			name: 'learn-storage-usage',
			code: function ()
			{
				console.log('>> learn-storage-usage')
				var event = entityos.get({ scope: '_event' });

				if (event.provider.hostname == undefined)
				{
					entityos.invoke('util-end', 'No hostname');
				}
				else
				{
					entityos._util.send(
					{
						headers: { 'x-api-key': event.provider.apikey },
						hostname: event.provider.hostname,
						path: '/api/v2/storage/consumed',
						method: 'GET'
					},
					'learn-storage-usage-process');
				}
			}
		});

		entityos.add(
		{
			name: 'learn-storage-usage-process',
			code: function (options, response)
			{
				console.log('>> learn-storage-usage-process')

				var event = entityos.get({ scope: '_event' });

				console.log(response);
				console.log(response.data);
				console.log(response.data.data.totalNativeFileSizeInKB);

				event.usage = { totalNativeFileSizeInKB: response.data.data.totalNativeFileSizeInKB }
				event.provider.apikey = _.truncate(event.provider.apikey, { length: 20 });

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

				if (error == undefined) { error = null }

				if (callback != undefined)
				{
					callback(error, data);
				}
			}
		});

		//STARTS HERE!
		entityos.invoke('learn-storage-init');
	}
}