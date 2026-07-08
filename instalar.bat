@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
echo.
echo === FORJA - Instalando dependencias (primeira vez) ===
echo.
npm install
echo.
echo Pronto! Agora rode iniciar-local.bat
pause
