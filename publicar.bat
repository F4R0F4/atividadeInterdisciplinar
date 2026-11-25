@echo off
set DOTNET=dotnet
if exist "%LOCALAPPDATA%\Microsoft\dotnet\dotnet.exe" set DOTNET="%LOCALAPPDATA%\Microsoft\dotnet\dotnet.exe"
cd /d "%~dp0Expresso"
%DOTNET% publish -c Release -o "%~dp0publicar"
echo.
echo Pronto! Envie o conteudo da pasta "publicar" para o servidor via FTP.
pause
