/*
	This is an example app to use as starting point for building a mydigitalstucture.cloud based nodejs app
	that you plan to host using AWS Lambda.

	To run it on your local computer your need to install:

	https://www.npmjs.com/package/lambda-local:

	And then run as:

	lambda-local -l index.js -t 9000 -e learn-event.json -envfile learn-context.json

	- where the data in event.json will be passed to the handler as event and the settings.json data will passed as context.

	Also see learn.js for more example code using the mydigitalstructure node module.
*/

exports.handler = function (event, context, callback)
{
	var mydigitalstructure = require('mydigitalstructure')
	var _ = require('lodash')
	var moment = require('moment');

	mydigitalstructure.set(
	{
		scope: 'learn',
		context: 'lambda',
		name: 'event',
		value: event
	});

	/*
		mydigitalstructure. methods impact local data.
		mydigitalstructure.cloud. methods impact data managed by the mydigitalstructure.cloud service (remote).
	*/

	mydigitalstructure.init(main)

	function main(err, data)
	{
		/*
			[LEARN EXAMPLE #1]
			Use mydigitalstructure.add to add your controller methods to your app and mydigitalstructure.invoke to run them,
			as per example learn-log.
		*/

		mydigitalstructure.add(
		{
			name: 'learn-log',
			code: function ()
			{
				console.log('Using mydigitalstructure module version ' + mydigitalstructure.VERSION);
				
				var eventData = mydigitalstructure.get(
				{
					scope: 'learn',
					context: 'lambda',
					name: 'event'
				});

				mydigitalstructure.cloud.invoke(
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

		mydigitalstructure.add(
		{
			name: 'learn-log-saved',
			code: function (param, response)
			{
				mydigitalstructure._util.message('learn-log event data saved to mydigitalstructure.cloud');
				mydigitalstructure._util.message(param);
				mydigitalstructure._util.message(response);
			}
		});
		
		mydigitalstructure.invoke('learn-log');
	}
}