@echo off
setlocal

REM Launch a local FORMCYCLE server and play a sound once it becomes reachable.
REM This is a convenience wrapper for Windows.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0launch-server.ps1" %*
exit /b %errorlevel%

