@echo off
set MYSQL_DIR=%LOCALAPPDATA%\MySQLPortable
if exist "%MYSQL_DIR%\mysql-8.4.13-winx64\bin\mysqld.exe" (
    echo Iniciando MySQL portatil...
    start "MySQL" /min "%MYSQL_DIR%\mysql-8.4.13-winx64\bin\mysqld.exe" --defaults-file="%MYSQL_DIR%\my.ini" --console
    timeout /t 5 /nobreak >nul
) else (
    echo Usando o MySQL ja instalado na maquina ^(localhost:3306, usuario root^).
)

set DOTNET=dotnet
if exist "%LOCALAPPDATA%\Microsoft\dotnet\dotnet.exe" set DOTNET="%LOCALAPPDATA%\Microsoft\dotnet\dotnet.exe"
cd /d "%~dp0Expresso"
start "" http://localhost:5000
%DOTNET% run
pause
