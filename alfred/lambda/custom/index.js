'use strict';
var Alexa = require('alexa-sdk');

  
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
        let action = this.event.request.intent.slots.action ? 
                     this.event.request.intent.slots.action.value : 'Unknown';

        let device = this.event.request.intent.slots.device ? 
                     this.event.request.intent.slots.device.value : 'Unknown';      

        let message = `Action is ${action} and device is ${device}`; 

        this.response
            .speak(message)
            .cardRenderer(message);
        this.emit(':responseReady');
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
