/*
	This is an example app to use as starting point for building a entityos.cloud based nodejs app
	that you plan to host using AWS Lambda.

	To run it on your local computer your need to install:

	https://www.npmjs.com/package/lambda-local:

	And then run as:

	lambda-local -l index.js -t 9000 -e learn-event.json

	- where the data in event.json will be passed to the handler as event and the settings.json data will passed as context.

	Also see learn.js for more example code using the entityos node module.
*/

exports.handler = function (event, context, callback)
{
	var entityos = require('	')
	var _ = require('lodash')
	var moment = require('moment');

	entityos.set(
	{
		scope: 'learn',
		context: 'lambda',
		name: 'event',
		value: event
	});

	/*
		entityos. methods impact local data.
		entityos.cloud. methods impact data managed by the entityos.cloud service (remote).
	*/

	entityos.init(main)

	function main(err, data)
	{
		/*
			[LEARN EXAMPLE #1]
			Use entityos.add to add your controller methods to your app and entityos.invoke to run them,
			as per example learn-log.
		*/

		entityos.add(
		{
			name: 'learn-log',
			code: function ()
			{
				console.log('Using entityos module version ' + entityos.VERSION);
				
				var eventData = entityos.get(
				{
					scope: 'learn',
					context: 'lambda',
					name: 'event'
				});

				entityos.cloud.invoke(
				{
					object: 'core_debug_log',
					fields:
					{
						data: JSON.stringify(eventData),
						notes: 'Learn Lambda Log'
					},
					callback: 'learn-log-saved'
				});
			}
		});

		entityos.add(
		{
			name: 'learn-log-saved',
			code: function (param, response)
			{
				entityos._util.message('learn-log event data saved to entityos.cloud');
				entityos._util.message(param);
				entityos._util.message(response);
			}
		});
		
		entityos.invoke('learn-log');
	}
}