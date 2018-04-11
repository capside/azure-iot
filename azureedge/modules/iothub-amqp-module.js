'use strict';

const Protocol = require('azure-iot-device-amqp').Amqp;
const DeviceClient = require('azure-iot-device').Client;
const Message = require('azure-iot-device').Message;

const EVENT_DIRECT_METHOD_INVOKED = 'EVENT_DIRECT_METHOD_INVOKED';

module.exports = {
  broker: null,
  configuration: null,

  create(broker, configuration) {
    this.broker = broker;
    this.configuration = configuration;

    let connectionString = '';
    if (this.configuration && this.configuration.connection_string) {
      console.log('Setting connection string to IoTHub from configuration.')
      connectionString = this.configuration.connection_string;
    } else if (process.env.DeviceConnectionString) {
      console.log('Setting connection string to IoTHub from environment variable.')
      connectionString = process.env.DeviceConnectionString;
    } else {
      console.error('Connection string not found in configuration.');
      return false;
    }
    console.log('Connecting to IoTHub.');
    this.iotHubClient = DeviceClient.fromConnectionString(connectionString, Protocol);
    this.iotHubClient.open(this.on_connect.bind(this));
    this.iotHubClient.on('message', this.on_iotHubMessage.bind(this));
    console.log('Registering direct method.');
    this.iotHubClient.onDeviceMethod('controlYeelight', this.on_controlYeelight.bind(this));

    return true;
  },

  receive(moduleMessage) {
    if(moduleMessage.content){
      let data = Buffer.from(moduleMessage.content).toString('utf8');
      if (this.connected) {
        var hubMessage = new Message(data);
        if (moduleMessage.properties) {
          for (var prop in moduleMessage.properties) {
            hubMessage.properties.add(prop, moduleMessage.properties[prop]);
          }
        }
        this.iotHubClient.sendEvent(hubMessage, err => {
          if (err) {
            console.error(`An error occurred when sending message to Azure IoT Hub: ${err.toString()}`);
          }
        });
      } 
    } else {
      console.log('writer.receive - Empty Message.content.');
    }
  },

  destroy() {
    console.log('iothub-amqp.destroy');
    if (this.connected) {
      this.iotHubClient.close();
    }
  },

  on_connect(err) {
    if (err) {
      console.error(`Could not connect to IoT Hub. Error: ${err.message}`);
    } else {
      console.log(`Connected to the hub.`);
      this.connected = true;
      this.iotHubClient.on('error', this.on_error.bind(this));
      this.iotHubClient.on('disconnect', this.on_disconnect.bind(this));
    }
  },

  on_error(err) {
    console.error(`Azure IoT Hub error: ${err.message}`);
  },

  on_disconnect() {
    console.log('Got disconnected from Azure IoT Hub.');
    this.connected = false;
  },

  on_iotHubMessage(iotHubMessage) {
    console.log('Message:\r\n%s.', JSON.stringify(iotHubMessage));
    console.log('Content:\r\n%s.', Buffer.from(iotHubMessage.data).toString('utf8'));
    this.iotHubClient.complete(iotHubMessage, function () {
        console.log('Message completed');
    });
  },

  on_controlYeelight(request, response) {
    this.publishMessage(EVENT_DIRECT_METHOD_INVOKED, 'Direct method (synchronous) invoked from Azure.', request.payload);
    response.send(200, `Method action completed.`);
  },

  publishMessage(eventId, text, command) {
    const payload = command;
    const message = { eventId, text, payload };
    const promise = this.broker.publish({
      properties: {
        source: 'iothub-amqp-module',
        name: eventId
      },
      content: new Uint8Array(Buffer.from(JSON.stringify(message), 'utf8'))
    });   
    return promise;                        
  } 
  
};