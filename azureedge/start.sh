#!/bin/sh

echo $DeviceConnectionString > DeviceConnectionString
echo $MqttUrl > MqttUrl

/etc/init.d/mosquitto start
npm run cloud
