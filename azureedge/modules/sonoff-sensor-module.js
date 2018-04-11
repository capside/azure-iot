'use strict';

const mqtt = require('mqtt');

const EVENT_TEMPERATURE_SENSOR = 'EVENT_TEMPERATURE_SENSOR';
const EVENT_HUMIDITY_SENSOR = 'EVENT_HUMIDITY_SENSOR';
const EVENT_SONOFF_RELAY_CHANGED ='EVENT_SONOFF_RELAY_CHANGED';

module.exports = {
  broker: null,
  configuration: null,

  create: function (broker, configuration) {
    this.broker = broker;
    this.configuration = configuration;

    console.log('Sonoff sensor module created.');

    return true;
  },

  /*
      Relay status sample messages:

    {
        "event": "EVENT_MQTT_MESSAGE_RECEIVED",
        "text": "Mqtt message received.",
        "topic": "/smarthome/sonoff/purple/data",
        "payload": {
            "relay/0": "1",
            "time": "2018-04-11 17:28:00",
            "mac": "5C:CF:7F:68:78:59",
            "host": "purple",
            "ip": "192.168.1.130",
            "id": 212
        }
    }
    {
        "event": "EVENT_MQTT_MESSAGE_RECEIVED",
        "text": "Mqtt message received.",
        "topic": "/smarthome/sonoff/purple/data",
        "payload": {
            "app": "ESPURNA",
            "version": "1.12.5",
            "board": "ITEAD_SONOFF_TH",
            "host": "purple",
            "ip": "192.168.1.130",
            "mac": "5C:CF:7F:68:78:59",
            "rssi": "-39",
            "uptime": "22705",
            "datetime": "2018-04-11 17:29:46",
            "freeheap": "22464",
            "relay/0": "0",
            "vcc": "3182",
            "loadavg": "1",
            "time": "2018-04-11 17:29:46",
            "id": 215
        }
    }

    Temperature/Humidity sample message:

    {
        "event": "EVENT_MQTT_MESSAGE_RECEIVED",
        "text": "Mqtt message received.",
        "topic": "/smarthome/sonoff/purple/data",
        "payload": {
            "temperature": "19.8",
            "humidity": "52",
            "time": "2018-04-11 17:31:52",
            "mac": "5C:CF:7F:68:78:59",
            "host": "purple",
            "ip": "192.168.1.130",
            "id": 216
        }
    }        
  */
 receive: function (message) {
    const messageContent = Buffer.from(message.content).toString('utf8');
    const topic = messageContent.match('/smarthome/sonoff/(.*)/data');
    if (topic && topic.length===2) {
        const sensorName = topic[1];
        const data = JSON.parse(messageContent);
        if (data.payload.temperature) {
            const payload = {
                id : sensorName,
                value : data.payload.temperature
            };
            this.publishMessage(EVENT_TEMPERATURE_SENSOR, 'Temperature reported by sensor (C).', payload);
        }
        if (data.payload.humidity) {
            const payload = {
                id : sensorName,
                value : data.payload.humidity
            };
            this.publishMessage(EVENT_HUMIDITY_SENSOR, 'Humidity reported by sensor (%).', payload);
        }
        if (data.payload['relay/0']) {
            const payload = {
                id : sensorName,
                value : data.payload['relay/0']
            };
            this.publishMessage(EVENT_SONOFF_RELAY_CHANGED, 'Sonoff relay state changed.', payload);
        }
    }
  },

  destroy: function () {
    console.log('sonoff-sensor.destroy');
  },

  publishMessage(eventId, text, payload) {
    const message = { eventId, text, payload };
    const edgeBrokerResult = this.broker.publish({
      properties: {
        source: 'sonoff-module-sensor',
        name: eventId
      },
      content: new Uint8Array(Buffer.from(JSON.stringify(message), 'utf8'))
    });  
    return edgeBrokerResult;                        
  } 

};
