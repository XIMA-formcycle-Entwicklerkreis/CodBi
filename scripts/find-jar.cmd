@echo off
setlocal enabledelayedexpansion
set FOUND=0
for /r "C:\Users\callari\.m2\repository\de\xima\fc" %%i in (*.jar) do (
    jar tf "%%i" 2>nul | findstr /i "CheckTrustLevel" >nul
    if !errorlevel! equ 0 (
        echo FOUND: %%i
        set FOUND=1
    )
)
if %FOUND% equ 0 echo NOT FOUND
endlocal
