$ErrorActionPreference = "Stop"

$candidateSerials = @(
  "127.0.0.1:5555",
  "127.0.0.1:5557",
  "127.0.0.1:5559",
  "127.0.0.1:5565"
)

$serial = $null

foreach ($candidate in $candidateSerials) {
  adb connect $candidate | Out-Null
  $devices = adb devices
  if ($devices -match ([regex]::Escape($candidate) + "\s+device")) {
    $serial = $candidate
    break
  }
}

if (-not $serial) {
  throw "[ldplayer] ADB could not find an active LDPlayer device on ports 5555, 5557, 5559, or 5565."
}

$env:ANDROID_SERIAL = $serial

Write-Host "[ldplayer] Using device $serial"

adb -s $serial reverse tcp:8081 tcp:8081 | Out-Null
adb -s $serial reverse tcp:5000 tcp:5000 | Out-Null

Write-Host "[ldplayer] ADB reverse applied for 8081 and 5000"
Write-Host "[ldplayer] Starting Expo dev client on port 8081"

npx expo start --dev-client --port 8081
