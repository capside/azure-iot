#!/bin/sh

echo $DeviceConnectionString > DeviceConnectionString
echo $MqttUrl > MqttUrl

npm run cloud
