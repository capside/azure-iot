'use strict';

const camelcase = require('camelcase');

const CMD_SONOFF_RELAY_POWER_ON = 'CMD_SONOFF_RELAY_POWER_ON';
const CMD_SONOFF_RELAY_POWER_OFF = 'CMD_SONOFF_RELAY_POWER_ON';

module.exports = {
  broker: null,
  configuration: null,

  create: function (broker, configuration) {
    this.broker = broker;
    this.configuration = configuration;

    return true;
  },

  start: function () {
    console.log('sonoff-relay.start');
  },

  /* 
    moduleMessage example:

    {
        "properties": {
            "source": "iothub-amqp-module",
            "name": "EVENT_SONOFF_RELAY_DIRECT_METHOD_INVOKED"
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
        "name": "EVENT_SONOFF_RELAY_DIRECT_METHOD_INVOKED"
        "text": "Direct method (synchronous) invoked from Azure.",
        "payload": {
            "command": "CMD_POWER_ON",
            "args": ['purple']
        }
    }    
  */

  receive(moduleMessage) {
    if(moduleMessage.content){
      let data = JSON.parse(Buffer.from(moduleMessage.content).toString('utf8'));
      if (data.eventType !== 'EVENT_SONOFF_RELAY_DIRECT_METHOD_INVOKED') {
        // Ignore commands directed to other devices
          return;
      }
      const commandName = camelcase(data.payload.command);
      console.log(`sonoff-relay-actuator.receive: Executing command ${commandName}.`);
      const commandFn = this[commandName];
      if (!commandFn) {
        console.error(`Command ${commandName} not supported.`);
      } else {
        commandFn.apply(this, data.payload.args);
      }
    } else {
      console.log('sonoff-relay.receive - Empty Message.content.');
    }
  },

  cmdPowerOn(deviceName) {
    const payload = {
        mqttTopic : `/smarthome/sonoff/${deviceName}/relay/0/set`,
        mqttMessage : '1'
    };
    this.publishMessage(CMD_SONOFF_RELAY_POWER_ON, 'Sonoff relay power on command.', payload);
  },

  cmdPowerOff(deviceName) {
    const payload = {
        mqttTopic : `/smarthome/sonoff/${deviceName}/relay/0/set`,
        mqttMessage : '0'
    };
    this.publishMessage(CMD_SONOFF_RELAY_POWER_ON, 'Sonoff relay power on command.', payload);
  },


  destroy: function() {
    console.log('sonoff-relay-actuator.destroy');
  },

  publishMessage(eventType, text, payload) {
    const message = { eventType, text, payload };
    const edgeBrokerResult = this.broker.publish({
      properties: {
        source: 'sonoff-module-sensor',
        name: eventType
      },
      content: new Uint8Array(Buffer.from(JSON.stringify(message), 'utf8'))
    });  
    return edgeBrokerResult;                        
  } 

};

