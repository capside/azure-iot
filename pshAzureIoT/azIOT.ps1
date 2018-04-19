function Connect-AzureIoTHub {
    <# 
        .SYNOPSIS 
        Connect device to IoT Hub. 
        .DESCRIPTION 
        See the Synopsis. 
        .EXAMPLE 
        Connect-AzureIoTHub -iotConnString "HostName=myiothub.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=HwbPu8ZhK8sdfdsfgdsgdfsfdgM2KvRE=" -deviceId "MyFirstDevice" 
    #>
    [cmdletbinding()]
    param(
      $iotConnString,
      $deviceId
    )
    $paramSet = @{
      iotConnString = $iotConnString
      deviceId  = $deviceId
    }

    $device = Get-IoTDeviceKey @paramSet
    if ($device.deviceId -eq $null) {
      $device = Register-IoTDevice @paramSet
    }
    return $device 
}

function Get-IoTCloudClient {
  <#
      .SYNOPSIS
      Create a connection object to interact with IoT Hub.
      .DESCRIPTION
      See the Synopsis.
      .EXAMPLE
      $cloudClient = Get-IoTCloudClient -iotConnString "HostName=myiothub.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=jkgyfjhhuytghji876tghj7w1QM2KvRE="
  #>
  [cmdletbinding()]
  param(
    $iotConnString
  )
  $cloudClient = [Microsoft.Azure.Devices.ServiceClient]::CreateFromConnectionString($iotConnString)
  return $cloudClient
}


function Get-IoTDeviceClient {
  <#
      .SYNOPSIS
      Create a connection object to interact with IoT Hub.
      .DESCRIPTION
      See the Synopsis.
      .EXAMPLE
      $deviceClient = Get-IoTDeviceClient -iotHubUri myiothub.azure-devices.net -deviceId SampleDevice -deviceKey klsdjkjfdsfh8weifjkhauwhfre=
  #>
  [cmdletbinding()]
  param(
    $iotHubUri,
    $deviceId,
    $deviceKey
  )
  $deviceAuthToken = New-Object Microsoft.Azure.Devices.Client.DeviceAuthenticationWithRegistrySymmetricKey($deviceId, $deviceKey)
  $deviceClient = [Microsoft.Azure.Devices.Client.DeviceClient]::Create($iotHubUri, $deviceAuthToken)
  return $deviceClient
}

function Get-IoTDeviceKey {
  <#
      .SYNOPSIS
      Get the device key for the device.
      .DESCRIPTION
      See the Synopsis.
      .EXAMPLE
      Get-IoTDeviceKey -iotConnString "HostName=myiothub.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=HwbPu8ZhK8sdfdsfgdsgdfsfdgM2KvRE=" -deviceId "MyFirstDevice"
  #>
  [cmdletbinding()]
  param(
    $iotConnString,
    $deviceId
  )
    
  $registryManager = [Microsoft.Azure.Devices.RegistryManager]::CreateFromConnectionString($iotConnString)
  $device = $registryManager.GetDeviceAsync($deviceId)
  $device = $device.Result
  $returndevice = New-Object -TypeName psobject -Property @{
    DeviceId = $device.Id
    DevicePrimaryKey = $device.Authentication.SymmetricKey.PrimaryKey
    DeviceSecondaryKey = $device.Authentication.SymmetricKey.SecondaryKey
  }
  return $returndevice
}

function Receive-IoTCloudMessage {
  <# 
      .SYNOPSIS 
      Receives a message from the cloud to the device. 
      .DESCRIPTION 
      See the Synopsis. 
      .EXAMPLE 
      $message = Receive-IoTCloudMessage -deviceClient $deviceClient 
      $message 
  #>
  [cmdletbinding()]
  param(
    $deviceClient
  )    
  while ($true) {
    $asyncOperation = $deviceClient.ReceiveAsync()
    $message = $asyncOperation.Result
    if ($message) {
      try {
        $text = [System.Text.Encoding]::ASCII.GetString($message.GetBytes())
        $deviceClient.CompleteAsync($message)
        return $text
      } catch {
        $deviceClient.AbandonAsync($message)
      }
    } else {
      Start-Sleep -Seconds 3
    }
  }
}

function Receive-IoTDeviceMessage {
  <#
      .SYNOPSIS
      Receives a message from the device to cloud.
      .DESCRIPTION
      See the Synopsis.
      .EXAMPLE
      $message = Receive-IoTDeviceMessage -iotConnString "HostName=myIotHub.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=HwbPu8ZhKsdfgdgdsgdfg1cxmbHh7w1QM2KvRE="
  #>
  [cmdletbinding()]
  param(
    $iotConnString
  )
  $eventHubClient = [Microsoft.ServiceBus.Messaging.EventHubClient]::CreateFromConnectionString($iotConnString, "messages/events")
    
  $eventHubPartitions = $eventHubClient.GetRuntimeInformation().PartitionIds
    
  foreach ($partition in $eventHubPartitions) {
    $eventHubReceiver = $eventHubClient.GetDefaultConsumerGroup().CreateReceiver($partition, [DateTime]::UtcNow)
    while ($true) {
      $asyncOperation = $eventHubReceiver.ReceiveAsync()
      $eventData = $asyncOperation.Result
      $message = [System.Text.Encoding]::UTF8.GetString($eventData.GetBytes())
      return $message
    }
  }
}

function Register-IoTDevice {
  <#
      .SYNOPSIS
      Registers an device to IoT Hub.
      .DESCRIPTION
      See the Synopsis.
      .EXAMPLE
      Register-IoTDevice -iotConnString "HostName=myiothub.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=HwbPu8ZhK8sdfdsfgdsgdfsfdgM2KvRE=" -deviceId "MyFirstDevice"
  #>
  [cmdletbinding()]
  param(
    $iotConnString,
    $deviceId
  )
    
  $registryManager = [Microsoft.Azure.Devices.RegistryManager]::CreateFromConnectionString($iotConnString)

  $newdevice = New-Object -TypeName Microsoft.Azure.Devices.Device -ArgumentList $deviceId
  $device = $registryManager.AddDeviceAsync($newdevice)
  $device.Exception
  $device = $device.Result
  $returndevice = New-Object -TypeName psobject -Property @{
    DeviceId = $device.Id
    DevicePrimaryKey = $device.Authentication.SymmetricKey.PrimaryKey
    DeviceSecondaryKey = $device.Authentication.SymmetricKey.SecondaryKey
  }
  return $returndevice
}

function Send-IoTCloudMessage {
  <#
      .SYNOPSIS
      Sends a message from the cloud to the Device.
      .DESCRIPTION
      See the Synopsis.
      .EXAMPLE
      Send-IoTCloudMessage -messageString "Hello world" -cloudClient $cloudClient
  #>
  [cmdletbinding()]
  param(
    $deviceId,
    $messageString,
    $cloudClient
  )
  $messagetosend = [Microsoft.Azure.Devices.Message]([Text.Encoding]::ASCII.GetBytes($messageString))
  $cloudClient.SendAsync($deviceId, $messagetosend)
}

function Send-IoTDeviceMessage {
  <#
      .SYNOPSIS
      Sends a message from the device to the IoT Hub.
      .DESCRIPTION
      See the Synopsis.
      .EXAMPLE
      Send-IoTDeviceMessage -messageString "Hello world" -deviceClient $deviceClient
  #>
  [cmdletbinding()]
  param(
    $messageString = "Foo",
    $deviceClient
  )
  $messagetosend = [Microsoft.Azure.Devices.Client.Message]([Text.Encoding]::ASCII.GetBytes($messageString))
  $deviceClient.SendEventAsync($messagetosend)
}

Function AlTurron(){

[cmdletbinding()]

param
(
[string]$id
)
    try {
        switch($id){
            "01"{
                printa("Entro al 01")
                break
            }
            "02"{
                printa("Entro al 02")
                break
            }
            "03"{
                printa("Entro al 03")
                break
            }
            default
            {
                printa("cuidado alguien te envio algo no esperado")
            }
        }
    }
    catch {
        $ex = $_.Exception
        Write-Host "Error: $($ex.Response.StatusCode) $($ex.Response.StatusDescription)" -f Red
        Write-Error "Error: $($ex.Response.StatusCode) $($ex.Response.StatusDescription)"
        write-host
        break
    }
}

function printa (){
[cmdletbinding()]

    param
    (
        [string]$text
    )
    echo "
    #################################
    #                               
    #   $text    
    #                               
    #################################
    "
}


#################################
#                               #
#    START HERE                 #
#                               #
#################################
printa("Cargando modulos azureiot")
import-module azureiot
printa("Conectando a AzureIoTHub")
$device = Connect-AzureIoTHub "HostName=alfredhub.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=UhfsmHqh8/T0lV7S+opM0LW/ogdksD1sd5/6UaEXwh8=" "pshDevice"
$deviceClient = Get-IoTDeviceClient "alfredhub.azure-devices.net" "pshDevice" $device.DevicePrimaryKey
printa("Conectado a AzureIoTHub")
while ($true){
    $text = Receive-IoTCloudMessage $deviceClient
    echo "Mensaje recibido correctamente"
    alturron($text[1])
}

