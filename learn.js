/*
	This is an example app to use as starting point for building a mydigitalstucture.cloud based nodejs app ... 
	Once nodejs has been installed; run 'node learn.js' using the OS terminal/console command prompt

	If you plan to host the app using AWS lambda then check out index.js

	Help @ https://learn-next.entityos.cloud/learn-function-automation
*/

var entityos = require('entityos')
var _ = require('lodash')
var moment = require('moment');

/*
	entityos. functions impact local data.
	entityos.cloud. functions impact data managed by the entityos.cloud service (remote).

	All functions invoked on entityos.cloud (remote) are asynchronous, 
	in that the local code will keep running after the invoke and you need to
	use a callcack: to a controller to handle the response from entityos.cloud, as in examples 5 & 5 below.	

	To get the current logged on user, use entityos.cloud.invoke({method: 'core_get_user_details'}),

	To get the settings.json data:

	var settings = entityos.get(
	{
		scope: '_settings'
	});
*/

entityos.init(main);

function main(err, data)
{
	if (entityos.data.settings.testing.status != 'true')
	{
		entityos._util.message(
		[
			'-',
			'LEARN-TIP #1:',
			' To see the entityos module requests to and received responses from entityos.cloud;',
			' set entityos.data.settings.testing.status: \"true\"',
			' and/or entityos.data.settings.testing.showData: \"true\" in settings.json',
		]);

		/*
			You can use entityos._util.message to write a message to the terminal command line.
			You can pass a string or an array of strings.  If it is an array each string will be displayed on a new line.
		*/ 
	}

	/*
		[LEARN EXAMPLE #1]
		Use entityos.add to add your controller functions to your app and entityos.invoke to run them,
		as per example app-show-session.
	*/

	entityos.add(
	{
		name: 'learn-example-1-show-session',
		code: function ()
		{
			entityos._util.message(
			[
				'-',
				'Using entityos module version ' + entityos.VERSION,
				'-',
				'',
				'LEARN-EXAMPLE #1; entityos.cloud session object:',
				entityos.data.session
			]);
		}
	});
	
	entityos.invoke('learn-example-1-show-session');

	/*
		[LEARN EXAMPLE #2]
		Now with some parameters and data.
		
		In example using entityos._util.message instead of console.log,
		so as to format message before showing in terminal/console.
	*/

	entityos.add(
	{
		name: 'learn-example-2-show-session',
		code: function (param, data)
		{
			if (!_.isUndefined(param))
			{
				entityos._util.message(
				[
					'-',
					'',
					param.hello,
					data
				])
			}

			return 'This is return; ' + param.hello
		}
	});

	var example2Return = entityos.invoke(
	'learn-example-2-show-session',
	{
		hello: 'LEARN-EXAMPLE #2; entityos.cloud session object:'
	},
	entityos.data.session);

	/*
		[LEARN EXAMPLE #3]
		Get and set data locally.
		
		This example uses entityos.set/.get - you can store at any level
		ie just scope, scope/context or scope/context/name.
		The value can be any Javascript data type ie string, number, object, array.
	*/

	entityos.add(
	{
		name: 'learn-example-3-local-data',
		code: function (param, data)
		{
			entityos.set(
			{
				scope: 'learn-example-3-local-data',
				context: 'example-context',
				name: 'example-name',
				value: 'example-value'
			});

			var data = entityos.get(
			{
				scope: 'learn-example-3-local-data',
				context: 'example-context',
				name: 'example-name'
			});

			entityos._util.message(
			[
				'-',
				'',
				'LEARN-EXAMPLE #3; Local Data:',
				data,
			]);
		}
	});

	entityos.invoke('learn-example-3-local-data');

	/*
		[LEARN EXAMPLE #4]
		Retrieve some data from entityos.cloud

		!! Call to entityos.cloud is asynchronous so a callback controller needs to be used.
			It then invokes the next example, else it will be invoked before this example is complete.
	*/

	entityos.add(
	[
		{
			name: 'learn-example-4-entityos.cloud-retrieve-contacts',
			code: function (param)
			{
				entityos.cloud.search(
				{
					object: 'contact_person',
					fields:
					[
						{name: 'firstname'},
						{name: 'surname'}
					],
					callback: 'learn-example-4-entityos.cloud-show-contacts'
				});
			}
		},
		{
			name: 'learn-example-4-entityos.cloud-show-contacts',
			note: 'Handles the response from entityos.cloud',
			code: function (param, response)
			{
				entityos._util.message(
				[
					'-',
					'',
					'LEARN-EXAMPLE #4; Returned JSON Data:',
					response
				]);

				/*
					Invoked here so is called after data is returned from mydigitalstucture.cloud
				*/

				entityos.invoke('learn-example-5-entityos.cloud-save-contact');
			}
		}
	]);

	entityos.invoke('learn-example-4-entityos.cloud-retrieve-contacts');

	/*
		[LEARN EXAMPLE #5]
		Save some data to entityos.cloud.

		!! Call to entityos.cloud is asynchronous so a callback controller needs to be used.
			It then invokes the next example, else it will be invoked before this example is complete.

		!!! entityos.cloud will return with error message ""No rights (No Access to method)",
			 to make it work update the settings.json logon & password to be your own,
			 ie. as you use to log on to https://console.entityos.cloud.
	*/

	entityos.add(
	[
		{
			name: 'learn-example-5-entityos.cloud-save-contact',
			code: function (param)
			{
				entityos.cloud.save(
				{
					object: 'contact_person',
					fields:
					{
						firstname: 'A',
						surname: 'B'
					},
					callback: 'learn-example-5-entityos.cloud-save-contact-confirm'
				});
			}
		},
		{
			name: 'learn-example-5-entityos.cloud-save-contact-confirm',
			note: 'Handles the response from entityos.cloud',
			code: function (param, response)
			{
				entityos._util.message(
				[
					'-',
					'',
					'LEARN-EXAMPLE #5; Returned JSON Data:',
					response
				]);

				entityos.invoke('learn-example-6-entityos.cloud-retrieve-contacts');
			}
		}
	]);

	/*
		[LEARN EXAMPLE #6]
		Retrieve some data from entityos.cloud
		And loop through the return rows and write them to the console.

		It also checks that the response as OK and if not shows the error.

		List of fields and filters @
		https://learn-next.entityos.cloud/schema

		To add a filter to search by say firstname add following to code below:
		{
			field: 'firstname',
			comparison: 'EQUAL_TO',
			value: 'John'
		}

		The following example uses the lodash.com _.each() method.

		!! Call to entityos.cloud is asynchronous so a callback controller needs to be used.
	*/

	entityos.add(
	[
		{
			name: 'learn-example-6-entityos.cloud-retrieve-contacts',
			code: function (param)
			{
				entityos.cloud.search(
				{
					object: 'contact_person',
					fields:
					[
						{name: 'firstname'},
						{name: 'surname'},
						{name: 'guid'}
					],
					filters:
					[],
					callback: 'learn-example-6-entityos.cloud-retrieve-contacts-show',
					all: true,
					rows: 10
				});
			}
		},
		{
			name: 'learn-example-6-entityos.cloud-retrieve-contacts-show',
			note: 'Handles the response from entityos.cloud and shows the contacts or error.',
			code: function (param, response)
			{
				if (response.status == 'ER')
				{
					entityos._util.message(
					[
						'-',
						'',
						'LEARN-EXAMPLE #6:',
						'Error Code; ' + response.error.errorcode,
						'Error Notes; ' + response.error.errornotes,
						'Help @ ' + response.error.methodhelp
					]);
				}
				else
				{
					entityos._util.message(
					[
						'-',
						'',
						'LEARN-EXAMPLE #6 Data:',
						'-'
					]);

					_.each(response.data.rows, function (row)
					{
						entityos._util.message(
						[
							'First name; ' + row.firstname,
							'Surname; ' + row.surname,
							'Unique ID; ' + row.guid,
							'-'
						]);
					});
				}

				entityos.invoke('learn-example-7-entityos.cloud-delete-contact');			
			}
		}
	]);

	/*
		[LEARN EXAMPLE #5]
		Delete data from entityos.cloud.

		!! Call to entityos.cloud is asynchronous so a callback controller needs to be used.
			It then invokes the next example, else it will be invoked before this example is complete.

		!!! entityos.cloud will return with error message ""No rights (No Access to method)",
			 to make it work update the settings.json logon & password to be your own,
			 ie. as you use to log on to https://console.entityos.cloud
			 AND set an id: that is a valid contact ID, as returned in examples above.
	*/

	entityos.add(
	[
		{
			name: 'learn-example-7-entityos.cloud-delete-contact',
			code: function (param)
			{
				entityos.cloud.delete(
				{
					object: 'contact_person',
					data: {id: 1234},
					callback: 'learn-example-7-entityos.cloud-delete-contact-show'
				});
			}
		},
		{
			name: 'learn-example-7-entityos.cloud-delete-contact-show',
			note: 'Handles the response from entityos.cloud',
			code: function (param, response)
			{
				entityos._util.message(
				[
					'-',
					'',
					'LEARN-EXAMPLE #7; Returned JSON Data:',
					response
				]);

				entityos.invoke('learn-example-8-get-user-details');
			}
		}
	]);

	/*
		[LEARN EXAMPLE #8]
		Invoke a function method directly on entityos.cloud.
		eg message_email_send, core_get_user_details

		You can set either:
		- method: ie 'core_get_user_details'
		- url: - this is the full url eg '/rpc/core/?method=core_get_user_details'
		
		and:
		- data: - json data set of name and values 
		- callback: - controller name to be called
		- callbackParam: parameters to be passed to the callback controller
	*/

	entityos.add(
	[
		{
			name: 'learn-example-8-get-user-details',
			code: function (param)
			{
				entityos._util.message(
				[
					'',
					'LEARN-EXAMPLE #8, Get user details using cloud.invoke:'
				]);

				entityos.cloud.invoke(
				{
					method: 'core_get_user_details',
					callback: 'learn-example-8-get-user-details-show'
				});
			}
		},
		{
			name: 'learn-example-8-get-user-details-show',
			code: function (param, response)
			{
				entityos._util.message(
				[
					'-',
					'',
					'LEARN-EXAMPLE #8, Get user details using cloud.invoke Data:',
					response
				]);

				entityos.invoke('learn-example-9-show-controllers');
			}
		}
	]);

	/*
		[LEARN EXAMPLE #9]
		Show controller code & notes to the terminal (console);
		Process comment line arguments.  You can also use module like yargs.
		In this case will show the controller code of a named controller or if the list of controllers
	*/

	entityos.add(
	[
		{
			name: 'learn-example-9-show-controllers',
			code: function (param)
			{
				entityos._util.message(
				[
					'',
					'LEARN-EXAMPLE #9, Show Controllers:'
				]);

				if (_.find(process.argv, function (a) {return (a == '/?')}))
				{
					var name = _.find(process.argv, function (a) {return _.includes(a, '/n:')});

					if (name != undefined)
					{
						name = _.replace(name, '/n:', '');
						entityos._util.controller.show({name: name});
					}
					else
					{
						entityos._util.controller.show()
					}
				}
				else
				{
					entityos._util.message(
					[
						'',
						'To show list of controllers add argument: /? e.g. node learn.js /?'
					]);
				}

				entityos._util.message(
				[
					'',
					'To show the code for a controller add argument: /n:[name of controller]',
					''
				]);
			}
		}
	])
}

/*
	[LEARN MORE]

	Authentication:
	https://docs.entityos.cloud/gettingstarted_authentication

	If you want to pass the data as application/JSON then you need to use the "auth-" http headers.
	- "auth-sid" = "sid"
	- "auth-logonkey" = "logonkey"
*/