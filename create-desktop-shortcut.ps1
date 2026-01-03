# Script pour créer le raccourci desktop avec icône

$AppName = "Stock Management"
$ScriptPath = "$PSScriptRoot\Stock-Management-Launcher.ps1"
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = "$DesktopPath\$AppName.lnk"

# Créer l'objet raccourci
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Configuration du raccourci
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`""
$Shortcut.WorkingDirectory = $PSScriptRoot
$Shortcut.Description = "Stock Management - Application de Gestion de Stock (Mode Intelligent)"

# Essayer d'utiliser une icône système appropriée
# Icône de dossier avec engrenage (gestion)
$Shortcut.IconLocation = "shell32.dll,70"

# Sauvegarder le raccourci
$Shortcut.Save()

Write-Host "✅ Raccourci créé sur le Desktop: $AppName" -ForegroundColor Green
Write-Host "📍 Emplacement: $ShortcutPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Fonctionnalités du raccourci:" -ForegroundColor Yellow
Write-Host "  • Détection automatique Internet/Local" -ForegroundColor White
Write-Host "  • Démarrage intelligent selon le contexte" -ForegroundColor White
Write-Host "  • Interface de choix si nécessaire" -ForegroundColor White
Write-Host ""
Write-Host "Double-cliquez sur l'icône pour lancer l'application !" -ForegroundColor Green