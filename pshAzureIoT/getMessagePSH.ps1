# Set REST API parameters
$apiVersion = "2016-11-14"
$contentType = "application/json;charset=utf-8"

# Set HTTP request headers to include Authorization header
$sasToken = iothub-explorer sas-token "dockerNodejsDevice" --login "HostName=alfredhub.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=UhfsmHqh8/T0lV7S+opM0LW/ogdksD1sd5/6UaEXwh8="
$count = 0
Foreach ($sasTokenSingle in $sasToken){
    if ($count -eq 1){
        $sas = $sasTokenSingle
    }
    $count ++
}
$requestHeader = @{"Authorization" = $sas}

# Set initial URI for calling Azure Resource Manager REST API
$uri = "https://alfredhub.azure-devices.net/devices/dockerNodejsDevice/messages/deviceBound?api-version=$apiVersion"
$uriCompleted = "https://alfredhub.azure-devices.net/devices/dockerNodejsDevice/messages/deviceBound/{etag}?api-version=2016-11-14"
    
# Call Azure Resource Manager REST API
$count = 0
while ($true){
    $result = Invoke-RestMethod -Uri $uri -Method Get -Headers $requestHeader -ContentType $contentType
    
    if ($result){
        echo Mensaje recibido: $result
        $count ++
        echo $count
    }
}

$result = Invoke-RestMethod -Uri $uri -Method Get -Headers $requestHeader -ContentType $contentType
$result



