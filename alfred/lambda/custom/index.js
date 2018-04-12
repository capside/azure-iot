'use strict';
const Alexa = require('alexa-sdk');
const Client = require('azure-iothub').Client;
const isLambda = require('is-lambda')

const EDGE_DEVICE_ID = 'smarthome';
  
exports.handler = function(event, context) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    console.log('Initiating alexa skill.');
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        console.log('Session started with reason: ' + JSON.stringify(this.event));
    },
    'SwitchIntent': function () {
        let alexaDevice = this.event.request.intent.slots.device ? 
                     this.event.request.intent.slots.device.value : 'Unknown';      
        let alexaAction = this.event.request.intent.slots.action ? 
                     this.event.request.intent.slots.action.value : 'Unknown';
 
        const iotHubParams = this.alexaToEdgeMapping[alexaDevice][alexaAction];                     

        this.invokeIotHubDirectMethod(EDGE_DEVICE_ID, iotHubParams.methodName, iotHubParams.payload, function (err, result) {
            if (err) {
                const message = 'Failed to invoke method \'' + message.method.methodName + '\': ' + err.message;
                console.log(`Error: ${message}.`);
                this.response
                    .speak(message)
                    .cardRenderer(message);
                this.emit(':responseReady');
            } else {
                console.log(`Invoking direct method ${message.method.methodName}`)
                console.log(message.method.methodName + ' on ' + message.deviceId + ':');
                console.log(JSON.stringify(result, null, 2));
                const message = `Ok.`;
                this.response
                    .speak(message)
                    .cardRenderer(message);
                this.emit(':responseReady');
            }
        });
    },

    alexaToEdgeMapping : {
        'lights' : {
            'turn on' : {
                methodName : 'controlYeelight',
                payload : {
                    command : 'CMD_POWER_ON', 
                    args : []
                }
            },
            'turn off' : {
                methodName : 'controlYeelight',
                payload : {
                    command : 'CMD_POWER_OFF', 
                    args : []
                }
            }
        },
        'heater' : {
            'turn on' : {
                methodName : 'controlSonoffRelay',
                payload : {
                    command : 'CMD_POWER_ON', 
                    args : ['purple']
                }
            },
            'turn off' : {
                methodName : 'controlSonoffRelay',
                payload : {
                    command : 'CMD_POWER_OFF', 
                    args : ['purple']
                }
            }
        }
    },

    invokeIotHubDirectMethod(deviceId, methodName, payload, callback) {
        const message = this.convertActionToIotHubMessage(action, device);
        const iotHubClient = Client.fromConnectionString(connectionString);  
        const methodParams = {
            methodName: methodName,
            payload: payload,
            timeoutInSeconds: 10
        };        
        iotHubClient.invokeDeviceMethod(deviceId, methodParams, callback);        
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

if (isLambda === false) {
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
