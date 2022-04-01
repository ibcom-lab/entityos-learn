/*
	This is an example app to use as starting point for building a mydigitalstucture.cloud based nodejs app ... 
	Once nodejs has been installed; run 'node learn.js' using the OS terminal/console command prompt

	If you plan to host the app using AWS lambda then check out index.js

	Help @ https://learn-next.entityos.cloud/learn-function-automation
*/

var entityos = require('entityos')
var _ = require('lodash')
var moment = require('moment');
var learnfactory = require('learnfactory');

/*
	entityos. functions impact local data.
	entityos.cloud. functions impact data managed by the entityos.cloud service (remote).

	All functions invoked on entityos.cloud (remote) are asynchronous, 
	in that the local code will keep running after the invoke and you need to
	use a callcack: controller to handle the response from entityos.cloud, as in examples 5 & 5 below.	

	To get the current logged on user using entityos.cloud.invoke({method: 'core_get_user_details'}),
*/

entityos.init(main)

function main(err, data)
{
	learnfactory.init()

	entityos.add(
	{
		name: 'learn-jactory-1-show',
		code: function (param)
		{
			var logID = entityos._util.param.get(param, 'logID').value;

			entityos._util.message(
			[
				'-',
				'Using learn factory module version ' + learnfactory.VERSION,
				'-',
				'Message from learn-jactory-1-show:',
				'Log ID; ' + logID
			]);
		}
	});
	
	entityos.invoke('util-log', {onComplete: 'learn-jactory-1-show'});

}