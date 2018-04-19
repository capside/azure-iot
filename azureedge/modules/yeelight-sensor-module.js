'use strict';

const Lookup = require('node-yeelight-wifi').Lookup;
var deepEqual = require('deep-equal');

const EVENT_LIGHT_DETECTED = 'EVENT_LIGHT_DETECTED';
const EVENT_LIGHT_DISCONNECTED = 'EVENT_LIGHT_DISCONNECTED';
const EVENT_LIGHT_STATUS_UPDATE = 'EVENT_LIGHT_STATUS_UPDATE';

const oldStates = {};

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
        this.publishMessage(EVENT_LIGHT_DETECTED, 
                       `New yeelight bulb detected: ${light.id}.`, light);

        light.on('stateUpdate',(light) => { 
          // TODO: manage scenes (currently no event is fired when the rgb is set by a scene)
          const currentState = light.getState();
          if (!oldStates[light.id] || !deepEqual(oldStates[light.id], currentState)) {
            this.publishMessage(EVENT_LIGHT_STATUS_UPDATE, 
              `Yeelight bulb state changed: ${light.id}.`, light);
            oldStates[light.id] = currentState;
          }
        });

        light.on('disconnected',() => { 
          this.publishMessage(EVENT_LIGHT_DISCONNECTED, 
                      `Lost connection with yeelight bulb ${light.id}.`, light);
        });
    
    });

  },

  receive: function (message) {
  },

  destroy: function() {
    console.log('yeelight-sensor.destroy');
  },

  /*  Example of generated event:
      {
        "eventId": "EVENT_LIGHT_STATUS_UPDATE",
        "text": "Yeelight bulb state changed: 0x0000000003329cc3.",
        "payload": {
          "type": "color",
          "power": true,
          "bright": 27,
          "rgb": {
            "r": 0,
            "g": 255,
            "b": 0
          },
          "hsb": {
            "h": 120,
            "s": 100,
            "b": 27
          },
          "id": "0x0000000003329cc3",
          "name": "",
          "mac": "28:6c:07:ae:1e:39",
          "host": "192.168.1.133",
          "port": 55443
        }
      }

  */
  publishMessage(eventType, text, light) {
    const payload = light.getState();
    payload.id = light.id;
    payload.name = light.name;
    payload.mac = light.mac;
    payload.host = light.host;
    payload.port = light.port;
    const message = { eventType, text, payload };
    this.broker.publish({
      properties: {
        source: 'yeelight-module-sensor',
        name: eventType
      },
      content: new Uint8Array(Buffer.from(JSON.stringify(message), 'utf8'))
    });  
  } 
};

