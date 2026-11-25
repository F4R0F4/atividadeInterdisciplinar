@echo off
if "%~3"=="" (
    echo Uso: enviar_ftp.bat HOST USUARIO SENHA [PASTA_REMOTA]
    exit /b 1
)
set HOST=%~1
set USUARIO=%~2
set SENHA=%~3
set REMOTA=%~4
cd /d "%~dp0publicar" || (echo Rode o publicar.bat primeiro. & exit /b 1)

setlocal enabledelayedexpansion
set ENVIADOS=0
for /r %%F in (*) do (
    set "ARQ=%%F"
    set "REL=!ARQ:%CD%\=!"
    set "REL=!REL:\=/!"
    curl -s --ftp-create-dirs -T "%%F" "ftp://%HOST%%REMOTA%/!REL!" --user "%USUARIO%:%SENHA%" && set /a ENVIADOS+=1
)
echo Arquivos enviados: !ENVIADOS!
pause
