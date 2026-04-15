@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ADB_HOME=%~dp0..\.adb-home"
if not exist "%ADB_HOME%" mkdir "%ADB_HOME%" >nul 2>&1
set "ANDROID_USER_HOME=%ADB_HOME%"
set "ANDROID_SDK_HOME=%ADB_HOME%"
set "HOME=%ADB_HOME%"
set "USERPROFILE=%ADB_HOME%"

set "SERIAL="

for %%S in (127.0.0.1:5555 127.0.0.1:5557 127.0.0.1:5559 127.0.0.1:5565) do (
  for /f "skip=1 tokens=1,2" %%A in ('adb devices') do (
    if "%%A"=="%%S" if "%%B"=="device" set "SERIAL=%%A"
  )
  if defined SERIAL goto found
)

echo [ldplayer] ADB could not find an active LDPlayer device on ports 5555, 5557, 5559, or 5565.
exit /b 1

:found
set "ANDROID_SERIAL=%SERIAL%"

echo [ldplayer] Using device %SERIAL%
adb -s %SERIAL% reverse tcp:8081 tcp:8081 >nul
adb -s %SERIAL% reverse tcp:5000 tcp:5000 >nul

echo [ldplayer] ADB reverse applied for 8081 and 5000
echo [ldplayer] Starting Expo dev client on port 8081

call npx expo start --dev-client --port 8081
