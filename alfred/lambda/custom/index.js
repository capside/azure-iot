'use strict';
const Alexa = require('alexa-sdk');
const Client = require('azure-iothub').Client;

const EDGE_DEVICE_ID = 'smarthome';

const isAWSLambda = process.env.LAMBDA_TASK_ROOT && process.env.AWS_EXECUTION_ENV;
const isAzureFunction = process.env.AzureWebJobsStorage;

if (isAWSLambda) {
    console.info('AWS Lambda environment detected.');
    exports.handler = awsLambdaHandler;
} else if (isAzureFunction) {
    console.info('Azure Functions environment detected.');
    exports.handler = azureFunctionHandler;
} else {
    console.info('Local execution detected.');
}

function azureFunctionHandler(azureCtx, req) {
    azureCtx.log('New request.\r\n %s', JSON.stringify(req.body));
    var context = {
        succeed: function (result) {
            azureCtx.log(JSON.stringify(result));
            azureCtx.res = {
                body: result
            };
            azureCtx.done();
        },
        fail:function (error) {
            azureCtx.log(JSON.stringify(error));
            azureCtx.res = {
                status: 400,
                body: err
            };
            azureCtx.done();
        }
    };
    var alexa = Alexa.handler(req.body, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
    azureCtx.log('Alexa executed.');
}

function awsLambdaHandler(event, context) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    console.log('Initiating alexa skill.');
    alexa.execute();
};

const alexaToEdgeMapping = {
    'illumination' : {
        'turn on' : {
            methodName : 'controlYeelight',
            payload : {
                command : 'CMD_POWER_ON', 
                args : []
            },
            response : `Ok, %s. The illumination has been turned on.` 
        },
        'turn off' : {
            methodName : 'controlYeelight',
            payload : {
                command : 'CMD_POWER_OFF', 
                args : []
            },
            response : `No problem, %s. I've turned off the illumination.` 
        }
    },
    'heater' : {
        'turn on' : {
            methodName : 'controlSonoffRelay',
            payload : {
                command : 'CMD_POWER_ON', 
                args : ['purple']
            },
            response : `Sure, %s. The heater is on.`
        },
        'turn off' : {
            methodName : 'controlSonoffRelay',
            payload : {
                command : 'CMD_POWER_OFF', 
                args : ['purple']
            },
            response : `Of course, %s. The heater is off now.`
        }
    }
};


function invokeIotHubDirectMethod(deviceId, methodName, payload, callback) {
    const connectionString = process.env.IotHubConnectionString;
    console.log(`Executing direct method ${methodName} over ${deviceId}.`);
    const iotHubClient = Client.fromConnectionString(connectionString);  
    const methodParams = {
        methodName: methodName,
        payload: payload,
        timeoutInSeconds: 10
    };        
    iotHubClient.invokeDeviceMethod(deviceId, methodParams, callback);        
}

var handlers = {
    'LaunchRequest': function () {
        console.log('Session started with reason: ' + JSON.stringify(this.event));
    },
    'SwitchIntent': function () {
        let alexaDevice = this.event.request.intent.slots.device ? 
                     this.event.request.intent.slots.device.value : 'Unknown';      
        let alexaAction = this.event.request.intent.slots.action ? 
                     this.event.request.intent.slots.action.value : 'Unknown';
 
        const targetCommands = alexaToEdgeMapping[alexaDevice];                     
        if (!targetCommands) {
            const message = `I'm afraid I don't know what is a ${alexaDevice}.`
            this.response
                .speak(message)
                .cardRenderer(message);
            this.emit(':responseReady');
            return;
        }
        const iotHubParams = alexaToEdgeMapping[alexaDevice][alexaAction];                     
        if (!iotHubParams) {
            const message = `I'm afraid I don't know how to do ${alexaAction} over ${alexaDevice}.`
            this.response
                .speak(message)
                .cardRenderer(message);
            this.emit(':responseReady');
            return;
        }

        invokeIotHubDirectMethod(EDGE_DEVICE_ID, iotHubParams.methodName, iotHubParams.payload, function (err, result) {
            if (err) {
                const message = 'Failed to invoke method \'' + iotHubParams.methodName + '\': ' + err.message;
                console.log(`Error: ${message}.`);
                this.response
                    .speak(message)
                    .cardRenderer(message);
                this.emit(':responseReady');
            } else {
                const username = Math.random() < 0.8 ? `` : `Master Bruce.`;
                const message = iotHubParams.response.replace('%s', username);
                this.response
                    .speak(message)
                    .cardRenderer(message);
                this.emit(':responseReady');
            }
        }.bind(this));
    },

    'SessionEndedRequest' : function() {
        console.log(`Alfred session ended with reason: ${this.event.request.reason}.`);
    },
    'AMAZON.StopIntent' : function() {
        this.response.speak('Bye');
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent' : function() {
        this.response.speak(`You can try: 'Alexa, ask Alfred to turn on the heater' or 'Alexa, ask Alfred to turn off the lights.'`);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent' : function() {
        this.response.speak(`Alfread says 'Bye'.`);
        this.emit(':responseReady');
    },
    'Unhandled' : function() {
        this.response.speak(`Sorry, Alfred didn't catch that.`);
    }
};

if (!isAWSLambda && !isAzureFunction) {
    if (!process.env.IotHubConnectionString) {
        console.log('Local execution detected but IotHubConnectionString env variable is not set.');
        return;
    }
    console.log('Local execution detected. Launching server.');
    var express = require('express');
    var bodyParser = require('body-parser');
    var app = express();
    app.use(bodyParser.json());
    app.post('/', function(req, res) {
        console.log('New request.');
        var context = {
            succeed: function (result) {
                console.log(result);
                res.json(result);
            },
            fail:function (error) {
                console.log(error);
            }
        };
        var alexa = Alexa.handler(req.body, context);
        alexa.registerHandlers(handlers);
        alexa.execute();
    });
    app.listen(80, function () {
        console.log('Server listening on port 80.');
    });    
}
