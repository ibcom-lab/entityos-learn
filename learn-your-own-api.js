/*
	LEARN; YOUR OWN API; USING AWS API GATEWAY & LAMBDA.

	This is the same as other lambda functions, but with a wrapper to process data from API Gateway & respond to it.

	This is an example app to use as starting point for building a mydigitalstucture.cloud based nodejs app
	that you plan to host using AWS Lambda and trigger via API gateway.

	To run it on your local computer your need to install:

	https://www.npmjs.com/package/lambda-local:

	And then run as:

	lambda-local -l index.js -t 9000 -e learn-event.json -envfile learn-context.json

	- where the data in event.json will be passed to the handler as event and the settings.json data will passed as context.

	Also see learn.js for more example code using the entityos node module.

	API Gateway docs:
	- https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html
	
*/

exports.handler = function (event, context, callback)
{
	var entityos = require('entityos')
	var _ = require('lodash')
	var moment = require('moment');

	/*
		[LEARN #1]
		Store the event data for use by controllers later.
	*/

	entityos.set(
	{
		scope: 'learn',
		context: 'lambda',
		name: 'event',
		value: event
	});

	entityos.set(
	{
		scope: 'learn',
		context: 'lambda',
		name: 'context',
		value: context
	});

	/*
		[LEARN #2]
		Use promise to responded to API Gateway once all the processing has been completed.
	*/

	const promise = new Promise(function(resolve, reject)
	{	
		entityos.init(main)

		function main(err, data)
		{
			/*
				[LEARN #3]
				Use entityos.add to add your controller methods to your app and entityos.invoke to run them,
				as per example learn-log.

				This examples saves the event data that comes in from the API Gateway into the myds log.

				app starts with app.invoke('learn-init') after controllers added.
			*/

			entityos.add(
			{
				name: 'learn-init',
				code: function ()
				{
					entityos._util.message('Using entityos module version ' + entityos.VERSION);
					entityos._util.message(entityos.data.session);

					var eventData = entityos.get(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'event'
					});

					var request =
					{ 
						body: {},
						queryString: {},
						headers: {}
					}

					if (eventData != undefined)
					{
						request =
						{ 
							queryString: eventData.queryStringParameters,
							headers: eventData.headers
						}

						if (_.isString(eventData.body))
						{
							request.body = JSON.parse(eventData.body)
						}
						else
						{
							request.body = eventData.body;
						}	
					}

					entityos.set(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'request',
						value: request
					});

					entityos.invoke('learn-user');
				}
			});

			entityos.add(
			{
				name: 'learn-user',
				code: function (param)
				{
					entityos.cloud.invoke(
					{
						method: 'core_get_user_details',
						callback: 'learn-user-process'
					});
				}
			});

			entityos.add(
			{
				name: 'learn-user-process',
				code: function (param, response)
				{
					console.log(response)

					entityos.set(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'user',
						value: response
					});

					entityos.invoke('learn-auth')
				}
			});

			entityos.add(
			{
				name: 'learn-auth',
				code: function (param)
				{
					// You can take user credentials from the body/header and pass to entityos.cloud.logon()
					// OR if using as proxy then use the credentials in settings.json - recommended (function/data) restricted user role.
					// In this example, checking that the GUID "api-key" passed in matches the api-key in the body (ssl).

					var request = entityos.get(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'request'
					});

					var requestGUID = request.body.apikey;

					var user = entityos.get(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'user'
					});

					entityos.cloud.invoke(
					{
						object: 'core_debug_log',
						fields:
						{
							data: JSON.stringify(request.body.apikey),
							notes: 'Learn Lambda Log (request.body.apikey)'
						}
					});

					if (requestGUID != user.guid)
					{
						entityos.set(
						{
							scope: 'learn',
							context: 'lambda',
							name: 'response',
							value:
							{
								status: 'ER',
								data: {error: {code: '1', description: 'Not a valid apikey [' + requestGUID + ']'}}
							}
						});

						entityos.invoke('learn-respond')
					}
					else
					{
						entityos.set(
						{
							scope: 'learn',
							context: 'lambda',
							name: 'response',
							value:
							{
								status: 'OK',
								data: {message: 'Valid apikey'}
							}
						});

						entityos.invoke('learn-process')
						
						//entityos.invoke('learn-log')
					}
				}
			});

			entityos.add(
			{
				name: 'learn-log',
				code: function ()
				{
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
							notes: 'Learn Lambda Log (Event)'
						}
					});

					var requestData = entityos.get(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'request'
					});

					entityos.cloud.invoke(
					{
						object: 'core_debug_log',
						fields:
						{
							data: JSON.stringify(requestData),
							notes: 'Learn Lambda Log (Request)'
						}
					});

					var contextData = entityos.get(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'context'
					});

					entityos.cloud.invoke(
					{
						object: 'core_debug_log',
						fields:
						{
							data: JSON.stringify(contextData),
							notes: 'Learn Lambda Log (Context)'
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
				
					entityos.invoke('learn-respond', {id: response.id})
				}
			});

			entityos.add(
			{
				name: 'learn-respond',
				code: function (param)
				{
					var response = entityos.get(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'response'
					});

					var statusCode = response.httpStatus;
					if (statusCode == undefined) {statusCode = '200'}

					var body = response.data;
					if (body == undefined) {body = {}}

					var headers = response.headers;
					if (headers == undefined) {headers = {}}

					let httpResponse =
					{
						statusCode: statusCode,
						headers: headers,
						body: JSON.stringify(body)
					};

					resolve(httpResponse)
				}
			});

			//app specfic code

			entityos.add(
			{
				name: 'learn-process',
				code: function ()
				{
					var request = entityos.get(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'request'
					});

					var data = request.body;

					//do the processing with the data in the body as per your api format;
				}
			});

			
			entityos.invoke('learn-init');
		}     
   });

  	return promise
}