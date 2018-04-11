## How to install IoT runtime

* Ensure you have selected python27:

```
SET PYTHON=<python-folder>
SET PATH=%python%;;%PYTHON%\Scripts
```
* Install the cli tool: `pip install -U azure-iot-edge-runtime-ctl`


* Configure and start the service:

```
iotedgectl setup --connection-string "HostName=alfredhub.azure-devices.net;DeviceId=smarthome;SharedAccessKey=CzXJaKgqbD9NZcCZbhUyWnyPfa5SrRSjOtYfppaOx/U=" --nopass
iotedgectl start
```

* Check the runtime:

```
docker logs edgAgent
docker exec edgeAgent printenv
```

