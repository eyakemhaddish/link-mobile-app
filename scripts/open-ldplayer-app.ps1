$ErrorActionPreference = "Stop"

$packageName = "com.link.mobileapp"

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

Write-Host "[ldplayer] Launching $packageName on $serial"

adb -s $serial shell monkey -p $packageName -c android.intent.category.LAUNCHER 1
