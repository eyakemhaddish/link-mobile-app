@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ADB_HOME=%~dp0..\.adb-home"
if not exist "%ADB_HOME%" mkdir "%ADB_HOME%" >nul 2>&1
set "ANDROID_USER_HOME=%ADB_HOME%"
set "ANDROID_SDK_HOME=%ADB_HOME%"
set "HOME=%ADB_HOME%"
set "USERPROFILE=%ADB_HOME%"

set "PACKAGE_NAME=com.link.mobileapp"
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

echo [ldplayer] Launching %PACKAGE_NAME% on %SERIAL%
adb -s %SERIAL% shell monkey -p %PACKAGE_NAME% -c android.intent.category.LAUNCHER 1
