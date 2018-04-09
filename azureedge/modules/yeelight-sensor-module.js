'use strict';

const Lookup = require('node-yeelight-wifi').Lookup;

const EVENT_LIGHT_DETECTED = 'EVENT_LIGHT_DETECTED';
const EVENT_LIGHT_DISCONNECTED = 'EVENT_LIGHT_DISCONNECTED';
const EVENT_LIGHT_STATUS_UPDATE = 'EVENT_LIGHT_STATUS_UPDATE';

module.exports = {
  broker: null,
  configuration: null,

  create: function (broker, configuration) {
    this.broker = broker;
    this.configuration = configuration;

    return true;
  },

  start: function () {

    let look = new Lookup();
    look.on('detected',(light) => {
        console.log(`New yeelight detected: ${light.id}.`);

        this.publishMessage(EVENT_LIGHT_DETECTED, 
                       `New yeelight bulb detected: ${light.id}.`);

        light.on('stateUpdate',(light) => { 
            this.publishMessage(EVENT_LIGHT_STATUS_UPDATE, 
                        `Yeelight bulb state changed: ${light.id}.`);
        });

        light.on('disconnected',() => { 
            this.publishMessage(EVENT_LIGHT_DISCONNECTED, 
                        `Lost connection with yeelight bulb ${light.id}.`);
        });
    
    });

  },

  receive: function (message) {
  },

  destroy: function() {
    console.log('yeelight-sensor.destroy');
  },

  publishMessage(eventId, text, payload) {
    const message = { eventId, text, payload };
    const promise = this.broker.publish({
      properties: {
        source: 'yeelight-module-sensor',
        name: eventId
      },
      content: new Uint8Array(Buffer.from(JSON.stringify(message), 'utf8'))
    });  
    return promise;                        
  } 
};

