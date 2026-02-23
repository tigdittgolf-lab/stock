# Script pour mettre a jour ngrok
Write-Host "Mise a jour de ngrok..." -ForegroundColor Cyan
Write-Host ""

# Arreter ngrok s'il tourne
Write-Host "Arret de ngrok..." -ForegroundColor Yellow
Stop-Process -Name ngrok -Force -ErrorAction SilentlyContinue

# Telecharger la derniere version
Write-Host "Telechargement de la derniere version..." -ForegroundColor Yellow
$downloadUrl = "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
$zipPath = "$env:TEMP\ngrok.zip"
$extractPath = "c:\ngrok"

Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing

# Extraire
Write-Host "Extraction..." -ForegroundColor Yellow
Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

# Nettoyer
Remove-Item $zipPath

Write-Host ""
Write-Host "OK! Ngrok mis a jour" -ForegroundColor Green
Write-Host ""
Write-Host "Maintenant, demarrez ngrok:" -ForegroundColor Cyan
Write-Host "  c:\ngrok\ngrok.exe http 3005" -ForegroundColor White
