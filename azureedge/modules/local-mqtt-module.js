'use strict';

const mqtt = require('mqtt');

const MQTT_PARENT_TOPIC = '/smarthome/#';
const EVENT_MQTT_MESSAGE_RECEIVED = 'EVENT_MQTT_MESSAGE_RECEIVED';

module.exports = {
  broker: null,
  configuration: null,
  mqttClient : null, 

  create(broker, configuration) {
    this.broker = broker;
    this.configuration = configuration;

    let mqttUrl = '';
    if (process.env.MqttUrl) { 
      console.log('Setting connection string to Mqtt from environment variable.')
      mqttUrl = process.env.MqttUrl;
    } else if (this.configuration && this.configuration.mqtt_url) {
      console.log('Setting connection string to mqtt from configuration.')
      mqttUrl = this.configuration.mqtt_url;
    } else {
      console.error('Connection string not found in environment (MqttUrl) nor configuration (mqtt_url).');
      return false;
    }
    const mqttOptions = {
      keepalive : 60,
      clientId  : 'local-mqtt-module',
      reconnectPeriod: 1000,
      connectTimeout : 30*1000,
      resubscribe : true
    };
    this.mqttClient = mqtt.connect(mqttUrl);
    this.mqttClient.on('connect', function () {
        console.log('Local mqtt module subscribed to mqtt broker.');
        this.mqttClient.subscribe(MQTT_PARENT_TOPIC);
        this.mqttClient.on('message', this.on_mqttMessage.bind(this));
    }.bind(this));
    this.mqttClient.on('error', this.on_mqttError.bind(this));

    console.log('Local mqtt module created.');
    return true;
  },


  /*
    Message sample:

    {
      "eventId": "CMD_SONOFF_RELAY_POWER_ON",
      "text": "Sonoff relay power on command.",
      "payload": {
        "mqttTopic": "/smarthome/sonoff/purple/relay/0/set",
        "mqttMessage": "0"
      }
    }    
  */
  receive(edgeMessage) {
    let data = JSON.parse(Buffer.from(edgeMessage.content).toString('utf8'));

    this.mqttClient.publish(data.payload.mqttTopic, data.payload.mqttMessage);
  },

  destroy() {
    console.log('local-mqtt.destroy');
    this.mqttClient.end();
  },

  on_mqttError(err) {
      console.warn('ERROR: %s', err);
  },

  on_mqttMessage(topic, mqttMessage) {
    let data = Buffer.from(mqttMessage).toString('utf8');

    const message = { 
        event: EVENT_MQTT_MESSAGE_RECEIVED, 
        text : 'Mqtt message received.', 
        topic : topic,
        payload : JSON.parse(data) 
    };
    const brokerResult = this.broker.publish({
      properties: {
        source: 'local-mqtt-module',
        name: EVENT_MQTT_MESSAGE_RECEIVED
      },
      content: new Uint8Array(Buffer.from(JSON.stringify(message), 'utf8'))
    });  
    return brokerResult;                        
  } 
  
};
