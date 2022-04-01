/*
	This is an example app to use as starting point for building a mydigitalstucture.cloud based nodejs app ... 
	Once nodejs has been installed; run 'node learn.js' using the OS terminal/console command prompt

	If you plan to host the app using AWS lambda then check out index.js

	Help @ https://learn-next.entityos.cloud/learn-function-automation

    Uses:

    SETUP_AUTOMATION_CONTROLLER_
        - automation: id of automation relates to
        - name: controller name
        - notes: text (8000)
        - version: text (50)
        - parameters: text(500)
        - code: text (large)
        - status: [1: Enabled, 2: Disabled]

    Run:
    node learn-using-factory-from-object-cloud.js

    Setup example automation in space:
    
    - Create automation:

    entityos.cloud.save(
    {
        object: 'setup_automation',
        data: 
        {
            title: 'Learn Automation Example',
            type: 4

        }
    });

    - Create automation controller:

    entityos.cloud.save(
    {
        object: 'setup_automation_controller',
        data:
        {
            automation: 1234,
            name: 'learn-automation-example-hello-world',
            parameters: 'param',
            code: '{console.log("CREATED FROM FACTORY OBJECT 2; " + param + " " + data)}'
        }
    });

    Help @
	- https://learn-next.entityos.cloud/learn-function-automation
	
  	To run local use https://www.npmjs.com/package/lambda-local:

	lambda-local -l learn-using-factory-from-object-cloud.js -t 9000 -e event-learn-factory-from-object-cloud.json
*/

exports.handler = function (event, context, callback)
{
    global.entityos = require('entityos')
	global._ = require('lodash')
	global.moment = require('moment');

	entityos.set(
	{
		scope: '_event',
		value: event
	});

    entityos._util.message(event);

	entityos.set(
	{
		scope: '_callback',
		value: callback
	});

	entityos.init(main);
	entityos._util.message('Using entityos module version ' + entityos.VERSION);

    function main(err, data)
    {
        entityos.add(
        {
            name: 'util-factory-load-from-cloud',
            notes: 'Get automation first',
            code: function (param, response)
            {
                var event = entityos.get({scope: '_event'});
                var okToContinue = false;
            
                if (event.automationGUID != undefined
                    || event.automationUUID != undefined
                    || event.automationTitle != undefined)
                {
                    okToContinue = true;
                }

                if (!okToContinue)
                {
                    console.log('Missing Automation Details!');
                }
                else
                {
                    if (response == undefined)
                    {
                        var filters = [];

                        if (event.automationID != undefined)
                        {
                            filters.push(
                            {
                                field: 'id',
                                value: event.automationID
                            });
                        }

                        if (event.automationUUID != undefined)
                        {
                            filters.push(
                            {
                                field: 'guid',
                                value: event.automationUUID
                            });
                        }

                        if (event.automationTitle != undefined)
                        {
                            filters.push(
                            {
                                field: 'title',
                                value: event.automationTitle
                            });
                        }

                        entityos.cloud.search(
                        {
                            object: 'setup_automation',
                            fields:
                            [
                                {name: 'title'},
                                {name: 'type'}
                            ],
                            filters: filters,
                            all: true,
                            callback: 'util-factory-load-from-cloud',
                            callbackParam: param
                        });
                    }
                    else
                    {
                        if (response.data.rows.length == 0)
                        {
                            console.log('Can not find automation!')
                        }
                        else
                        {
                            event.automationID = entityos.set(
                            {
                                scope: 'util-factory-load-from-cloud',
                                context: 'automation-id',
                                value: _.first(response.data.rows).id
                            });

                            entityos.invoke('util-factory-load-from-cloud-controllers');
                        }
                    }
                }
            }
        });

        entityos.add(
        {
            name: 'util-factory-load-from-cloud-controllers',
            code: function (param, response)
            {
                var event = entityos.get({scope: '_event'});
                var okToContinue = false;

                if (event.invokeControllerName != undefined)
                {
                    okToContinue = true;
                }

                if (!okToContinue)
                {
                    console.log('!! There is no controller to invoke [invokeControllerName].');
                }
                else
                {
                    event.automationID = entityos.get(
                    {
                        scope: 'util-factory-load-from-cloud',
                        context: 'automation-id'
                    });

                    if (response == undefined)
                    {
                        var filters = [];

                        if (event.automationID != undefined)
                        {
                            filters.push(
                            {
                                field: 'automation',
                                value: event.automationID
                            });
                        }

                        if (event.controllerName != undefined)
                        {
                            filters.push(
                            {
                                field: 'name',
                                value: event.controllerName
                            });
                        }

                        if (event.controllerUUID != undefined)
                        {
                            filters.push(
                            {
                                field: 'name',
                                value: event.controllerUUID
                            });
                        }

                        if (event.controllerVersion != undefined)
                        {
                            filters.push(
                            {
                                field: 'version',
                                value: controllerVersion
                            });
                        }

                        entityos.cloud.search(
                        {
                            object: 'setup_automation_controller',
                            fields:
                            [
                                {name: 'automation'},
                                {name: 'name'},
                                {name: 'notes'},
                                {name: 'version'},
                                {name: 'status'},
                                {name: 'role'},
                                {name: 'parameters'},
                                {name: 'code'}
                            ],
                            filters: filters,
                            all: true,
                            callback: 'util-factory-load-from-cloud-controllers',
                            callbackParam: param
                        });
                    }
                    else
                    {
                        if (response.data.rows.length == 0)
                        {
                            console.log('No controllers!')
                        }
                        else
                        {
                            learnfactoryControllers = response.data.rows;
                            var controllers = [];
                        
                            _.each(learnfactoryControllers, function(learnfactoryController)
                            {
                                learnfactoryController.code = _.unescape(learnfactoryController.code);
                                if (_.startsWith(learnfactoryController.code, 'function'))
                                {
                                    learnfactoryController._code = _.split(learnfactoryController.code, ')');
                                    learnfactoryController._arguments = _.split(_.first(learnfactoryController._code), '(');
                                    learnfactoryController._arguments = _.last(learnfactoryController._arguments);

                                    learnfactoryController._code.shift();
                                    learnfactoryController._codeBody = _.join(learnfactoryController._code, ')');
                                }
                                else
                                {
                                    learnfactoryController._codeBody = learnfactoryController.code;
                                    learnfactoryController._arguments = learnfactoryController.parameters;
                                }
                            
                                controllers.push( 
                                {
                                    name: learnfactoryController.name,
                                    code: new Function(learnfactoryController._arguments, learnfactoryController._codeBody)
                                });
                            });
   
                            console.log(controllers)

                            entityos.add(controllers);

                            //entityos.invoke('util-end', {status: 'ADDED'});

                            entityos.invoke('util-using-factory-from-object-cloud-invoke');
                        }
                    }
                }
            }
        });

        entityos.add(
        {
            name: 'util-using-factory-from-object-cloud-invoke',
            code: function (param, response)
            {
                var event = entityos.get({scope: '_event'});
                var settings = entityos.get({scope: '_settings'});

                if (response == undefined)
                {
                    var notes = 'Controller [' + event.invokeControllerName + '] invoked';

                    if (event.invokeControllerParam != undefined && event.invokeControllerParam != '')
                    {
                        notes = notes + ' with parameters [' + JSON.stringify(event.invokeControllerParam) + '] '
                    }

                    notes = notes + ' by [' + settings.entityos.logon + '].'

                    entityos.cloud.save(
                    {
                        object: 'setup_automation_scheduler_log',
                        data:
                        {
                            automation: event.automationID,
                            notes: notes 
                        },
                        callback: 'util-using-factory-from-object-cloud-invoke',
                        callbackParam: param
                    });
                }
                else
                {
                    entityos.invoke(event.invokeControllerName, event.invokeControllerParam);
                }
            }
        });

        entityos.add(
        {
            name: 'learn-using-factory-from-object-cloud',
            code: function (param)
            {
                entityos.invoke('util-factory-load-from-cloud');
            }
        });

        //-- UTIL controllers

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

        entityos.add(
        {
            name: 'util-automation-controller-end',
            code: function (param, response)
            {
                if (_.isPlainObject(param))
                {
                    param = JSON.stringify(param);
                }

                if (response == undefined)
                {
                    var event = entityos.get({scope: '_event'});

                    var notes = 'Controller [' + event.invokeControllerName + '] ended with [' + param + ']';

                    entityos.cloud.save(
                    {
                        object: 'setup_automation_scheduler_log',
                        data:
                        {
                            automation: event.automationID,
                            notes: notes 
                        },
                        callback: 'util-automation-controller-end',
                        callbackParam: param
                    });
                }
                else
                {
                    entityos.invoke('util-end', param);
                }
            }
        });

        entityos.invoke('learn-using-factory-from-object-cloud');
    }
}