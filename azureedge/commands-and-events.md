# Commands and Events

## DC: controlYeelight

```
{
   "command" : "CMD_POWER_ON",
   "args" : []
}
```

```
{
   "command" : "CMD_POWER_OFF",
   "args" : []
}
```

```
{
   "command" : "CMD_SET_RGB",
   "args" : [255, 200, 0]
}
```

```
{
   "command" : "CMD_SET_Bright",
   "args" : [1]
}
```

```
{
   "command" : "CMD_SET_Bright",
   "args" : [100]
}
```


## DC: controlSonoffRelay

```
{
   "command" : "CMD_POWER_ON",
   "args" : ['purple']
}
```

```
{
   "command" : "CMD_POWER_OFF",
   "args" : ['purple']
}
```

## IotHub Sonoff Relay Event


```
 Device: [smarthome], 
 Data: [{
	"eventId": "EVENT_SONOFF_RELAY_STATUS_UPDATE",
	"text": "Sonoff relay state changed.",
	"payload": {
		"id": "purple",
		"value": "0"
	}
 }]
 Properties:
	'source': 'sonoff-module-sensor'
	'name': 'EVENT_SONOFF_RELAY_STATUS_UPDATE'
```

## IotHub Sonoff Temperature Lecture event

```
 Device: [smarthome], 
 Data:
	[{
		"eventId": "EVENT_TEMPERATURE_SENSOR_LECTURE",
		"text": "Temperature reported by sensor (C).",
		"payload": {
			"id": "purple",
			"value": "19.5"
		}
	}] 
 Properties:
	'source': 'sonoff-module-sensor'
	'name': 'EVENT_TEMPERATURE_SENSOR_LECTURE'
```

## IotHub Sonoff Humidity Lecture event
	
```
Device: [smarthome], 
Data:[{
	"eventId": "EVENT_HUMIDITY_SENSOR_LECTURE",
	"text": "Humidity reported by sensor (%).",
	"payload": {
		"id": "purple",
		"value": "52"
	}
}]
Properties:
	'source': 'sonoff-module-sensor'
	'name': 'EVENT_HUMIDITY_SENSOR_LECTURE'
```

	
	