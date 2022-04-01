/*
	This is an example app to use as starting point for building a mydigitalstucture.cloud based nodejs app ... 
	Once nodejs has been installed; run 'node learn.js' using the OS terminal/console command prompt

	If you plan to host the app using AWS lambda then check out index.js

	Help @ https://learn-next.mydigitalstructure.cloud/learn-function-automation
*/

var mydigitalstructure = require('mydigitalstructure')
var _ = require('lodash')
var moment = require('moment');

/*
	mydigitalstructure. functions impact local data.
	mydigitalstructure.cloud. functions impact data managed by the mydigitalstructure.cloud service (remote).

	All functions invoked on mydigitalstructure.cloud (remote) are asynchronous, 
	in that the local code will keep running after the invoke and you need to
	use a callcack: controller to handle the response from mydigitalstructure.cloud, as in examples 5 & 5 below.	

	To get the current logged on user using mydigitalstructure.cloud.invoke({method: 'core_get_user_details'}),

	To get the settings.json data:

	var settings = mydigitalstructure.get(
	{
		scope: '_settings'
	});
*/

mydigitalstructure.init(main);

function main(err, data)
{
	if (mydigitalstructure.data.settings.testing.status != 'true')
	{
		mydigitalstructure._util.message(
		[
			'-',
			'LEARN-TIP #1:',
			' To see the mydigitalstructure module requests to and received responses from mydigitalstructure.cloud;',
			' set mydigitalstructure.data.settings.testing.status: \"true\"',
			' and/or mydigitalstructure.data.settings.testing.showData: \"true\" in settings.json',
		]);

		/*
			You can use mydigitalstructure._util.message to write a message to the terminal command line.
			You can pass a string or an array of strings.  If it is an array each string will be displayed on a new line.
		*/ 
	}

	/*
		[LEARN EXAMPLE #1]
		Use mydigitalstructure.add to add your controller functions to your app and mydigitalstructure.invoke to run them,
		as per example app-show-session.
	*/

	mydigitalstructure.add(
	{
		name: 'learn-example-1-show-session',
		code: function ()
		{
			mydigitalstructure._util.message(
			[
				'-',
				'Using mydigitalstructure module version ' + mydigitalstructure.VERSION,
				'-',
				'',
				'LEARN-EXAMPLE #1; mydigitalstructure.cloud session object:',
				mydigitalstructure.data.session
			]);
		}
	});
	
	mydigitalstructure.invoke('learn-example-1-show-session');

	/*
		[LEARN EXAMPLE #2]
		Now with some parameters and data.
		
		In example using mydigitalstructure._util.message instead of console.log,
		so as to format message before showing in terminal/console.
	*/

	mydigitalstructure.add(
	{
		name: 'learn-example-2-show-session',
		code: function (param, data)
		{
			if (!_.isUndefined(param))
			{
				mydigitalstructure._util.message(
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

	var example2Return = mydigitalstructure.invoke(
	'learn-example-2-show-session',
	{
		hello: 'LEARN-EXAMPLE #2; mydigitalstructure.cloud session object:'
	},
	mydigitalstructure.data.session);

	/*
		[LEARN EXAMPLE #3]
		Get and set data locally.
		
		This example uses mydigitalstructure.set/.get - you can store at any level
		ie just scope, scope/context or scope/context/name.
		The value can be any Javascript data type ie string, number, object, array.
	*/

	mydigitalstructure.add(
	{
		name: 'learn-example-3-local-data',
		code: function (param, data)
		{
			mydigitalstructure.set(
			{
				scope: 'learn-example-3-local-data',
				context: 'example-context',
				name: 'example-name',
				value: 'example-value'
			});

			var data = mydigitalstructure.get(
			{
				scope: 'learn-example-3-local-data',
				context: 'example-context',
				name: 'example-name'
			});

			mydigitalstructure._util.message(
			[
				'-',
				'',
				'LEARN-EXAMPLE #3; Local Data:',
				data,
			]);
		}
	});

	mydigitalstructure.invoke('learn-example-3-local-data');

	/*
		[LEARN EXAMPLE #4]
		Retrieve some data from mydigitalstructure.cloud

		!! Call to mydigitalstructure.cloud is asynchronous so a callback controller needs to be used.
			It then invokes the next example, else it will be invoked before this example is complete.
	*/

	mydigitalstructure.add(
	[
		{
			name: 'learn-example-4-mydigitalstructure.cloud-retrieve-contacts',
			code: function (param)
			{
				mydigitalstructure.cloud.search(
				{
					object: 'contact_person',
					fields:
					[
						{name: 'firstname'},
						{name: 'surname'}
					],
					callback: 'learn-example-4-mydigitalstructure.cloud-show-contacts',
                    contentType: 'application/json'
				});
			}
		},
		{
			name: 'learn-example-4-mydigitalstructure.cloud-show-contacts',
			note: 'Handles the response from mydigitalstructure.cloud',
			code: function (param, response)
			{
				mydigitalstructure._util.message(
				[
					'-',
					'',
					'LEARN-EXAMPLE #4; Returned JSON Data:',
					response
				]);

				/*
					Invoked here so is called after data is returned from mydigitalstucture.cloud
				*/

				mydigitalstructure.invoke('learn-example-5-mydigitalstructure.cloud-save-contact');
			}
		}
	]);

	mydigitalstructure.invoke('learn-example-4-mydigitalstructure.cloud-retrieve-contacts');

	/*
		[LEARN EXAMPLE #5]
		Save some data to mydigitalstructure.cloud.

		!! Call to mydigitalstructure.cloud is asynchronous so a callback controller needs to be used.
			It then invokes the next example, else it will be invoked before this example is complete.

		!!! mydigitalstructure.cloud will return with error message ""No rights (No Access to method)",
			 to make it work update the settings.json logon & password to be your own,
			 ie. as you use to log on to https://console.mydigitalstructure.cloud.
	*/

	mydigitalstructure.add(
	[
		{
			name: 'learn-example-5-mydigitalstructure.cloud-save-contact',
			code: function (param)
			{
				mydigitalstructure.cloud.save(
				{
					object: 'contact_person',
					fields:
					{
						firstname: 'A',
						surname: 'B'
					},
					callback: 'learn-example-5-mydigitalstructure.cloud-save-contact-confirm'
				});
			}
		},
		{
			name: 'learn-example-5-mydigitalstructure.cloud-save-contact-confirm',
			note: 'Handles the response from mydigitalstructure.cloud',
			code: function (param, response)
			{
				mydigitalstructure._util.message(
				[
					'-',
					'',
					'LEARN-EXAMPLE #5; Returned JSON Data:',
					response
				]);

				mydigitalstructure.invoke('learn-example-6-mydigitalstructure.cloud-retrieve-contacts');
			}
		}
	]);

	/*
		[LEARN EXAMPLE #6]
		Retrieve some data from mydigitalstructure.cloud
		And loop through the return rows and write them to the console.

		It also checks that the response as OK and if not shows the error.

		List of fields and filters @
		https://learn-next.mydigitalstructure.cloud/schema

		To add a filter to search by say firstname add following to code below:
		{
			field: 'firstname',
			comparison: 'EQUAL_TO',
			value: 'John'
		}

		The following example uses the lodash.com _.each() method.

		!! Call to mydigitalstructure.cloud is asynchronous so a callback controller needs to be used.
	*/

	mydigitalstructure.add(
	[
		{
			name: 'learn-example-6-mydigitalstructure.cloud-retrieve-contacts',
			code: function (param)
			{
				mydigitalstructure.cloud.search(
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
					callback: 'learn-example-6-mydigitalstructure.cloud-retrieve-contacts-show',
					all: true,
					rows: 1
				});
			}
		},
		{
			name: 'learn-example-6-mydigitalstructure.cloud-retrieve-contacts-show',
			note: 'Handles the response from mydigitalstructure.cloud and shows the contacts or error.',
			code: function (param, response)
			{
				if (response.status == 'ER')
				{
					mydigitalstructure._util.message(
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
					mydigitalstructure._util.message(
					[
						'-',
						'',
						'LEARN-EXAMPLE #6 Data:',
						'-'
					]);

					_.each(response.data.rows, function (row)
					{
						mydigitalstructure._util.message(
						[
							'First name; ' + row.firstname,
							'Surname; ' + row.surname,
							'Unique ID; ' + row.guid,
							'-'
						]);
					});
				}

				mydigitalstructure.invoke('learn-example-7-mydigitalstructure.cloud-delete-contact');			
			}
		}
	]);

	/*
		[LEARN EXAMPLE #5]
		Delete data from mydigitalstructure.cloud.

		!! Call to mydigitalstructure.cloud is asynchronous so a callback controller needs to be used.
			It then invokes the next example, else it will be invoked before this example is complete.

		!!! mydigitalstructure.cloud will return with error message ""No rights (No Access to method)",
			 to make it work update the settings.json logon & password to be your own,
			 ie. as you use to log on to https://console.mydigitalstructure.cloud
			 AND set an id: that is a valid contact ID, as returned in examples above.
	*/

	mydigitalstructure.add(
	[
		{
			name: 'learn-example-7-mydigitalstructure.cloud-delete-contact',
			code: function (param)
			{
				mydigitalstructure.cloud.delete(
				{
					object: 'contact_person',
					data: {id: 1234},
					callback: 'learn-example-7-mydigitalstructure.cloud-delete-contact-show'
				});
			}
		},
		{
			name: 'learn-example-7-mydigitalstructure.cloud-delete-contact-show',
			note: 'Handles the response from mydigitalstructure.cloud',
			code: function (param, response)
			{
				mydigitalstructure._util.message(
				[
					'-',
					'',
					'LEARN-EXAMPLE #7; Returned JSON Data:',
					response
				]);

				mydigitalstructure.invoke('learn-example-8-get-user-details');
			}
		}
	]);

	/*
		[LEARN EXAMPLE #8]
		Invoke a function method directly on mydigitalstructure.cloud.
		eg message_email_send, core_get_user_details

		You can set either:
		- method: ie 'core_get_user_details'
		- url: - this is the full url eg '/rpc/core/?method=core_get_user_details'
		
		and:
		- data: - json data set of name and values 
		- callback: - controller name to be called
		- callbackParam: parameters to be passed to the callback controller
	*/

	mydigitalstructure.add(
	[
		{
			name: 'learn-example-8-get-user-details',
			code: function (param)
			{
				mydigitalstructure._util.message(
				[
					'',
					'LEARN-EXAMPLE #8, Get user details using cloud.invoke:'
				]);

				mydigitalstructure.cloud.invoke(
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
				mydigitalstructure._util.message(
				[
					'-',
					'',
					'LEARN-EXAMPLE #8, Get user details using cloud.invoke Data:',
					response
				]);

				mydigitalstructure.invoke('learn-example-9-show-controllers');
			}
		}
	]);

	/*
		[LEARN EXAMPLE #9]
		Show controller code & notes to the terminal (console);
		Process comment line arguments.  You can also use module like yargs.
		In this case will show the controller code of a named controller or if the list of controllers
	*/

	mydigitalstructure.add(
	[
		{
			name: 'learn-example-9-show-controllers',
			code: function (param)
			{
				mydigitalstructure._util.message(
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
						mydigitalstructure._util.controller.show({name: name});
					}
					else
					{
						mydigitalstructure._util.controller.show()
					}
				}
				else
				{
					mydigitalstructure._util.message(
					[
						'',
						'To show list of controllers add argument: /? e.g. node learn.js /?'
					]);
				}

				mydigitalstructure._util.message(
				[
					'',
					'To show the code for a controller add argument: /n:[name of controller]',
					''
				]);
			}
		}
	])
}