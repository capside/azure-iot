'use strict';
var Alexa = require("alexa-sdk");
var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://iot.eclipse.org')

  
exports.handler = function(event, context) {
    client.on('connect', function () {
        console.log('Mqtt client connected.');
        var alexa = Alexa.handler(event, context);
        alexa.registerHandlers(handlers);
        console.log('Initiating alexa skill.');
        alexa.execute();
    });
};

var handlers = {
    'LaunchRequest': function () {
        console.log('Session started with reason: ' + JSON.stringify(this.event));
    },
    'AlfredIntent': function () {
        let action = this.event.request.intent.slots.action ? 
                     this.event.request.intent.slots.action.value : 'Unknown';

        let device = this.event.request.intent.slots.device ? 
                     this.event.request.intent.slots.device.value : 'Unknown';      

        if (device === 'fan') {
            if (action === 'switch on') {
                client.publish('cmnd/sonoff_pink/power', '1')
            } else if (action === 'switch off') {
                client.publish('cmnd/sonoff_pink/power', '0')
            }
        }             

        let message = 'Action is ' + action + ' and device is ' + device; 

        this.response
            .speak(message)
            .cardRenderer(message);
        this.emit(':responseReady');
    },
    'SessionEndedRequest' : function() {
        console.log('Session ended with reason: ' + this.event.request.reason);
    },
    'AMAZON.StopIntent' : function() {
        this.response.speak('Bye');
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent' : function() {
        this.response.speak("You can try: 'alexa, hello world' or 'alexa, ask hello world my" +
            " name is awesome Aaron'");
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent' : function() {
        this.response.speak('Bye');
        this.emit(':responseReady');
    },
    'Unhandled' : function() {
        this.response.speak("Sorry, I didn't get that. You can try: 'alexa, hello world'" +
            " or 'alexa, ask hello world my name is awesome Aaron'");
    }
};
