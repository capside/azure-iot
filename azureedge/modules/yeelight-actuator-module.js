'use strict';

const Lookup = require('node-yeelight-wifi').Lookup;
const camelcase = require('camelcase');

const lights = {};

module.exports = {
  broker: null,
  configuration: null,

  create: function (broker, configuration) {
    this.broker = broker;
    this.configuration = configuration;

    return true;
  },

  start: function () {
    console.log('yeelight-actuator.start');

    let look = new Lookup();
    look.on('detected',(light) => {
        lights[light.id] = light;
        light.on('stateUpdate', (light) => {});
        light.on('disconnected',() => {
            // TODO: how to know which one?
            console.log(`At least one light lost connection.`);
        });
    });
  },

  /* 
    moduleMessage example:

    {
        "properties": {
            "source": "iothub-amqp-module",
            "name": "EVENT_YEELIGHT_DIRECT_METHOD_INVOKED"
        },
        "content": {
            "0": 123,
            ...
            "143": 125,
            "144": 125
        }
    }
        
    Decodified moduleMessage.content example:

    {
        "eventId": "EVENT_YEELIGHT_DIRECT_METHOD_INVOKED",
        "text": "Direct method (synchronous) invoked from Azure.",
        "payload": {
            "command": "CMD_POWER_ON",
            "args": []
        }
    }    
  */

  receive(moduleMessage) {
    if(moduleMessage.content){
      let data = JSON.parse(Buffer.from(moduleMessage.content).toString('utf8'));
      if (data.eventId !== 'EVENT_YEELIGHT_DIRECT_METHOD_INVOKED') {
          // Ignore commands directed to other devices
          return;
      }
      const commandName = camelcase(data.payload.command);
      const commandFn = this[commandName];
      if (!commandFn) {
        console.error(`Command ${commandName} not supported.`);
      } else {
        commandFn.apply(this, data.payload.args);
      }
    } else {
      console.log('yeelight-actuator.receive - Empty Message.content.');
    }
  },

  cmdPowerOn() {
    for (let lightId in lights) {
        if (lights.hasOwnProperty(lightId)) {
            lights[lightId].setPower('on', 0.5);
        }
    }     
  },

  cmdPowerOff() {
    for (let lightId in lights) {
        if (lights.hasOwnProperty(lightId)) {
            lights[lightId].setPower('off', 0.5);
        }
    }     
  },

  /* Each value in the range from 0 to 255. */
  cmdSetRgb(r, g, b) {
    for (let lightId in lights) {
        if (lights.hasOwnProperty(lightId)) {
            lights[lightId]
                .setRGB([r, g, b])
                .then(light => console.log(`${lightId} color changed.`))
                .catch(err => console.warn(`Error changing color: ${err}.`));
        }
    }     
  },

  /* Valid values from 1 to 100. */
  cmdSetBright(level) {
    for (let lightId in lights) {
        if (lights.hasOwnProperty(lightId)) {
            lights[lightId].setBright(level);
        }
    }     
  },

  destroy: function() {
    console.log('yeelight-actuator.destroy');
  },

};

