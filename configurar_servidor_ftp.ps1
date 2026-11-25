# Servidor FTP no IIS conforme "Roteiro_Instalacao_FTP_Windows.docx".
# Rodar no PowerShell como Administrador:
#   powershell -ExecutionPolicy Bypass -File configurar_servidor_ftp.ps1
param(
    [string]$Site    = "Servidor_FTP_Empresa",
    [string]$Raiz    = "C:\FTP_Root",
    [string]$Usuario = "usuario_ftp",
    [int]$PortaPassivaIni = 50000,
    [int]$PortaPassivaFim = 50100
)
$ErrorActionPreference = "Stop"

# 2. Recursos do Windows (IIS + FTP + console)
Enable-WindowsOptionalFeature -Online -All -NoRestart -FeatureName `
    "IIS-FTPServer", "IIS-FTPSvc", "IIS-FTPExtensibility", "IIS-ManagementConsole" | Out-Null

# Usuário local do FTP (senha sem expirar evita o erro 530 do troubleshooting)
if (-not (Get-LocalUser -Name $Usuario -ErrorAction SilentlyContinue)) {
    $senha = Read-Host "Senha para $Usuario" -AsSecureString
    New-LocalUser -Name $Usuario -Password $senha -PasswordNeverExpires -UserMayNotChangePassword | Out-Null
}

# 3. Pasta raiz + NTFS: usuário com Modificar (nunca Controle Total); Administradores já têm Controle Total
New-Item -ItemType Directory -Force $Raiz | Out-Null
icacls $Raiz /grant "${Usuario}:(OI)(CI)M" | Out-Null

# 4. Site FTP: porta 21, sem SSL (rede interna), autenticação Básica, Ler+Gravar só para o usuário
Import-Module WebAdministration
if (Test-Path "IIS:\Sites\$Site") { Remove-WebSite -Name $Site }
New-WebFtpSite -Name $Site -Port 21 -PhysicalPath $Raiz | Out-Null
Set-ItemProperty "IIS:\Sites\$Site" -Name ftpServer.security.ssl.controlChannelPolicy -Value 0
Set-ItemProperty "IIS:\Sites\$Site" -Name ftpServer.security.ssl.dataChannelPolicy -Value 0
Set-ItemProperty "IIS:\Sites\$Site" -Name ftpServer.security.authentication.basicAuthentication.enabled -Value $true
Add-WebConfiguration "/system.ftpServer/security/authorization" -PSPath IIS:\ -Location $Site `
    -Value @{ accessType = "Allow"; users = $Usuario; permissions = "Read,Write" }

# Modo passivo 50000-50100 (resolve o travamento em "Obtendo listagem de pastas...")
Set-WebConfigurationProperty -PSPath IIS:\ -Filter system.ftpServer/firewallSupport -Name lowDataChannelPort  -Value $PortaPassivaIni
Set-WebConfigurationProperty -PSPath IIS:\ -Filter system.ftpServer/firewallSupport -Name highDataChannelPort -Value $PortaPassivaFim

# 5. Firewall: porta 21, serviço ftpsvc e faixa passiva
netsh advfirewall firewall delete rule name="Servidor FTP - Porta 21" | Out-Null
netsh advfirewall firewall add rule name="Servidor FTP - Porta 21" dir=in action=allow protocol=TCP localport=21
netsh advfirewall firewall delete rule name="Servidor FTP (IIS Service)" | Out-Null
netsh advfirewall firewall add rule name="Servidor FTP (IIS Service)" dir=in action=allow service=ftpsvc
netsh advfirewall firewall delete rule name="Servidor FTP - Passivo" | Out-Null
netsh advfirewall firewall add rule name="Servidor FTP - Passivo" dir=in action=allow protocol=TCP localport="$PortaPassivaIni-$PortaPassivaFim"

Restart-Service ftpsvc

# 6. Validação
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } | Select-Object -First 1).IPAddress
Write-Host "`nPronto. Teste: ftp $ip  (deve mostrar '220 Microsoft FTP Service')"
Write-Host "FileZilla: Host ftp://$ip  Usuário $Usuario  Porta 21"
Write-Host "Deploy do site: publicar.bat e depois  enviar_ftp.bat $ip $Usuario SENHA"
