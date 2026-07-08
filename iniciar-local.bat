@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
echo.
echo === FORJA - Servidor local ===
echo.
echo Abrindo em http://localhost:3000
echo (Se a porta 3000 estiver ocupada, use a URL que aparecer abaixo)
echo.
echo Para parar: feche esta janela ou pressione Ctrl+C
echo.
npm run dev
pause
