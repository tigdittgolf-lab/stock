# 🎨 Application d'Icône ICO - Stock Management
# Script spécialisé pour les fichiers .ico

param(
    [string]$IcoPath = "stock-management-custom.ico"
)

$AppName = "Stock Management"
$ShortcutName = "Stock Management.lnk"
$LauncherScript = "Stock-Management-Launcher.ps1"

function Apply-ICOIcon {
    param([string]$IconFilePath)
    
    $shortcutPath = "$([Environment]::GetFolderPath('Desktop'))\$ShortcutName"
    $launcherPath = "$PSScriptRoot\$LauncherScript"
    $fullIconPath = "$PSScriptRoot\$IconFilePath"
    
    Write-Host "Application d'Icone ICO - $AppName" -ForegroundColor Magenta
    Write-Host "=" * 50 -ForegroundColor Gray
    Write-Host ""
    
    # Vérifications
    if (-not (Test-Path $fullIconPath)) {
        Write-Host "ERREUR: Fichier ICO non trouve: $fullIconPath" -ForegroundColor Red
        Write-Host ""
        Write-Host "Solutions:" -ForegroundColor Yellow
        Write-Host "1. Generez une icone ICO avec: .\create-professional-icon.html"
        Write-Host "2. Verifiez que le fichier est bien dans ce dossier"
        Write-Host "3. Verifiez le nom du fichier (sensible a la casse)"
        return $false
    }
    
    if (-not (Test-Path $launcherPath)) {
        Write-Host "ERREUR: Script launcher non trouve: $launcherPath" -ForegroundColor Red
        return $false
    }
    
    # Vérifier que c'est bien un fichier ICO
    $extension = [System.IO.Path]::GetExtension($fullIconPath).ToLower()
    if ($extension -ne ".ico") {
        Write-Host "ATTENTION: Le fichier n'est pas un .ico mais un $extension" -ForegroundColor Yellow
        Write-Host "Les fichiers non-ICO peuvent ne pas s'afficher correctement" -ForegroundColor Yellow
        Write-Host ""
    }
    
    try {
        Write-Host "Application de l'icone ICO..." -ForegroundColor Yellow
        Write-Host "Fichier ICO: $fullIconPath" -ForegroundColor Cyan
        
        # Supprimer l'ancien raccourci
        if (Test-Path $shortcutPath) {
            Remove-Item $shortcutPath -Force
            Write-Host "Ancien raccourci supprime" -ForegroundColor Green
        }
        
        # Créer le nouveau raccourci avec l'icône ICO
        $WshShell = New-Object -comObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($shortcutPath)
        $Shortcut.TargetPath = "powershell.exe"
        $Shortcut.Arguments = "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcherPath`""
        $Shortcut.WorkingDirectory = $PSScriptRoot
        $Shortcut.IconLocation = $fullIconPath
        $Shortcut.Description = "$AppName - Gestion de Stock Intelligente"
        $Shortcut.Save()
        
        Write-Host ""
        Write-Host "SUCCES ! Icone ICO appliquee !" -ForegroundColor Green
        Write-Host "Raccourci: $shortcutPath" -ForegroundColor Cyan
        Write-Host "Icone ICO: $fullIconPath" -ForegroundColor Cyan
        
        # Rafraîchir le bureau
        Write-Host ""
        Write-Host "Rafraichissement du bureau..." -ForegroundColor Yellow
        
        # Envoyer F5 au bureau
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.SendKeys]::SendWait("{F5}")
        
        Write-Host "Termine ! Votre icone ICO devrait s'afficher correctement." -ForegroundColor Green
        return $true
        
    } catch {
        Write-Host "ERREUR lors de l'application: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# === EXECUTION ===

Clear-Host
$success = Apply-ICOIcon -IconFilePath $IcoPath

Write-Host ""
if ($success) {
    Write-Host "L'icone ICO a ete appliquee avec succes !" -ForegroundColor Green
    Write-Host "Si elle ne s'affiche pas immediatement, faites F5 sur le bureau." -ForegroundColor Yellow
} else {
    Write-Host "Echec de l'application de l'icone." -ForegroundColor Red
    Write-Host "Generez d'abord une icone ICO avec le generateur professionnel." -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Appuyez sur Entree pour fermer"