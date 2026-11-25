@echo off
rem Roda o site publicado em C:\FTP_Root (enviado por FTP) acessivel na rede: http://IP:8080
rem Na 1a vez, abra como Administrador (libera o firewall). Deixe a janela aberta.
set DOTNET=dotnet
if exist "%LOCALAPPDATA%\Microsoft\dotnet\dotnet.exe" set DOTNET="%LOCALAPPDATA%\Microsoft\dotnet\dotnet.exe"
netsh advfirewall firewall add rule name="Site Expresso 8080" dir=in action=allow protocol=TCP localport=8080 >nul 2>&1
cd /d C:\FTP_Root
%DOTNET% ExpressoSushi.dll --urls http://0.0.0.0:8080
pause
