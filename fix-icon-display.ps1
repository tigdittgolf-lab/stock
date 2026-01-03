# 🔧 Correction Affichage Icône - Solution Alternative
# Script pour forcer l'affichage de l'icône avec méthodes alternatives

param(
    [switch]$UseSystemIcon,
    [switch]$Help
)

$AppName = "Stock Management"
$ShortcutName = "Stock Management.lnk"
$LauncherScript = "Stock-Management-Launcher.ps1"

function Show-Help {
    Write-Host "Correction Affichage Icone - $AppName" -ForegroundColor Magenta
    Write-Host "=" * 50 -ForegroundColor Gray
    Write-Host ""
    Write-Host "Ce script essaie plusieurs methodes pour corriger l'affichage de l'icone:" -ForegroundColor Yellow
    Write-Host "1. Conversion ICO vers format Windows natif"
    Write-Host "2. Utilisation d'icones systeme fiables"
    Write-Host "3. Recreation complete du raccourci"
    Write-Host ""
}

function Test-IconFile {
    param([string]$IconPath)
    
    if (-not (Test-Path $IconPath)) {
        Write-Host "Fichier icone non trouve: $IconPath" -ForegroundColor Red
        return $false
    }
    
    $fileInfo = Get-Item $IconPath
    Write-Host "Fichier icone trouve:" -ForegroundColor Green
    Write-Host "  Nom: $($fileInfo.Name)" -ForegroundColor Cyan
    Write-Host "  Taille: $($fileInfo.Length) octets" -ForegroundColor Cyan
    Write-Host "  Modifie: $($fileInfo.LastWriteTime)" -ForegroundColor Cyan
    
    # Vérifier que c'est un vrai fichier ICO
    $bytes = [System.IO.File]::ReadAllBytes($IconPath)
    if ($bytes.Length -gt 6 -and $bytes[0] -eq 0 -and $bytes[1] -eq 0 -and $bytes[2] -eq 1 -and $bytes[3] -eq 0) {
        Write-Host "  Format: ICO valide" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  Format: Fichier ICO invalide ou corrompu" -ForegroundColor Red
        return $false
    }
}

function Create-AlternativeShortcut {
    param([string]$IconLocation, [string]$Method)
    
    $shortcutPath = "$([Environment]::GetFolderPath('Desktop'))\$ShortcutName"
    $launcherPath = "$PSScriptRoot\$LauncherScript"
    
    Write-Host "Methode ${Method}: Creation du raccourci..." -ForegroundColor Yellow
    
    try {
        # Supprimer l'ancien raccourci
        if (Test-Path $shortcutPath) {
            Remove-Item $shortcutPath -Force
            Start-Sleep -Seconds 1
        }
        
        # Créer le nouveau raccourci avec paramètres spéciaux
        $WshShell = New-Object -comObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($shortcutPath)
        $Shortcut.TargetPath = "powershell.exe"
        $Shortcut.Arguments = "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcherPath`""
        $Shortcut.WorkingDirectory = $PSScriptRoot
        $Shortcut.IconLocation = $IconLocation
        $Shortcut.Description = "$AppName - Application de Gestion de Stock"
        $Shortcut.WindowStyle = 1
        $Shortcut.Save()
        
        # Forcer la mise à jour des propriétés
        Start-Sleep -Seconds 1
        $Shortcut = $WshShell.CreateShortcut($shortcutPath)
        $Shortcut.IconLocation = $IconLocation
        $Shortcut.Save()
        
        Write-Host "Raccourci cree avec la methode ${Method}" -ForegroundColor Green
        Write-Host "Icone: $IconLocation" -ForegroundColor Cyan
        
        return $true
        
    } catch {
        Write-Host "Erreur avec la methode ${Method} : $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Force-IconRefresh {
    Write-Host "Rafraichissement force de l'affichage..." -ForegroundColor Yellow
    
    # Méthode 1: Redémarrer l'explorateur Windows
    try {
        Write-Host "Redemarrage de l'explorateur Windows..." -ForegroundColor Cyan
        Stop-Process -Name "explorer" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
        Start-Process "explorer.exe"
        Start-Sleep -Seconds 5
        Write-Host "Explorateur redémarre" -ForegroundColor Green
    } catch {
        Write-Host "Erreur lors du redemarrage de l'explorateur" -ForegroundColor Red
    }
    
    # Méthode 2: Vider le cache d'icônes
    try {
        $cacheFiles = @(
            "$env:LOCALAPPDATA\IconCache.db",
            "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\*.db"
        )
        
        foreach ($pattern in $cacheFiles) {
            $files = Get-ChildItem -Path (Split-Path $pattern) -Filter (Split-Path $pattern -Leaf) -ErrorAction SilentlyContinue
            foreach ($file in $files) {
                Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
                Write-Host "Cache supprime: $($file.Name)" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "Erreur lors du nettoyage du cache" -ForegroundColor Red
    }
    
    # Méthode 3: F5 programmatique
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("{F5}")
    
    Write-Host "Rafraichissement termine" -ForegroundColor Green
}

# === LOGIQUE PRINCIPALE ===

if ($Help) {
    Show-Help
    return
}

Clear-Host
Write-Host "Correction Affichage Icone - $AppName" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host ""

if ($UseSystemIcon) {
    Write-Host "Mode: Utilisation d'une icone systeme fiable" -ForegroundColor Yellow
    $iconLocation = "shell32.dll,46"  # Icône de boîtes empilées
    $success = Create-AlternativeShortcut -IconLocation $iconLocation -Method "Systeme"
} else {
    # Essayer avec l'icône personnalisée
    $customIcon = "$PSScriptRoot\stock-management-custom.ico"
    
    Write-Host "Etape 1: Verification du fichier ICO..." -ForegroundColor Yellow
    $iconValid = Test-IconFile -IconPath $customIcon
    
    if ($iconValid) {
        Write-Host ""
        Write-Host "Etape 2: Tentative avec l'icone personnalisee..." -ForegroundColor Yellow
        $success = Create-AlternativeShortcut -IconLocation $customIcon -Method "Personnalisee"
    } else {
        Write-Host ""
        Write-Host "Etape 2: Utilisation d'une icone systeme de secours..." -ForegroundColor Yellow
        $iconLocation = "shell32.dll,46"
        $success = Create-AlternativeShortcut -IconLocation $iconLocation -Method "Secours"
    }
}

if ($success) {
    Write-Host ""
    Write-Host "Etape 3: Rafraichissement force..." -ForegroundColor Yellow
    Force-IconRefresh
    
    Write-Host ""
    Write-Host "TERMINE ! Verifiez votre bureau maintenant." -ForegroundColor Green
    Write-Host ""
    Write-Host "Si l'icone ne s'affiche toujours pas:" -ForegroundColor Yellow
    Write-Host "1. Relancez avec: .\fix-icon-display.ps1 -UseSystemIcon" -ForegroundColor Cyan
    Write-Host "2. Redemarrez completement votre PC" -ForegroundColor Cyan
    Write-Host "3. Verifiez que le fichier ICO n'est pas corrompu" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "ECHEC de la creation du raccourci." -ForegroundColor Red
    Write-Host "Essayez: .\fix-icon-display.ps1 -UseSystemIcon" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Appuyez sur Entree pour fermer"