# 🔄 Forcer le Rafraîchissement d'Icône - Stock Management
# Script pour résoudre le problème de "feuille blanche"

param(
    [switch]$ClearCache,
    [switch]$Help
)

$AppName = "Stock Management"
$ShortcutName = "Stock Management.lnk"
$LauncherScript = "Stock-Management-Launcher.ps1"

function Show-Help {
    Write-Host "Forcer le Rafraichissement d'Icone - $AppName" -ForegroundColor Magenta
    Write-Host "=" * 60 -ForegroundColor Gray
    Write-Host ""
    Write-Host "Ce script resout le probleme de 'feuille blanche' en:" -ForegroundColor Yellow
    Write-Host "1. Nettoyant le cache d'icones Windows"
    Write-Host "2. Recréant le raccourci avec la bonne icone"
    Write-Host "3. Forçant le rafraichissement du bureau"
    Write-Host ""
    Write-Host "UTILISATION:" -ForegroundColor Yellow
    Write-Host "  .\force-icon-refresh.ps1           # Application automatique"
    Write-Host "  .\force-icon-refresh.ps1 -ClearCache # Nettoyer seulement le cache"
    Write-Host ""
}

function Clear-IconCache {
    Write-Host "Nettoyage du cache d'icones Windows..." -ForegroundColor Yellow
    
    try {
        # Arrêter l'explorateur Windows
        Write-Host "Arret de l'explorateur Windows..." -ForegroundColor Cyan
        Stop-Process -Name "explorer" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        
        # Supprimer les fichiers de cache d'icônes
        $cachePaths = @(
            "$env:LOCALAPPDATA\IconCache.db",
            "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\iconcache_*.db"
        )
        
        foreach ($path in $cachePaths) {
            if (Test-Path $path) {
                Remove-Item $path -Force -ErrorAction SilentlyContinue
                Write-Host "Cache supprime: $path" -ForegroundColor Green
            }
        }
        
        # Redémarrer l'explorateur
        Write-Host "Redemarrage de l'explorateur Windows..." -ForegroundColor Cyan
        Start-Process "explorer.exe"
        Start-Sleep -Seconds 3
        
        Write-Host "Cache d'icones nettoye avec succes !" -ForegroundColor Green
        
    } catch {
        Write-Host "Erreur lors du nettoyage du cache: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Redemarrage de l'explorateur..." -ForegroundColor Yellow
        Start-Process "explorer.exe" -ErrorAction SilentlyContinue
    }
}

function Find-BestIcon {
    # Chercher les icônes dans l'ordre de préférence (ICO en priorité)
    $iconPriority = @(
        "stock-management-custom.ico",
        "stock-management.ico",
        "stock-management-custom-64.png",
        "stock-management-custom-256.png", 
        "stock-management-custom.png",
        "stock-management.png"
    )
    
    foreach ($iconName in $iconPriority) {
        $iconPath = "$PSScriptRoot\$iconName"
        if (Test-Path $iconPath) {
            $extension = [System.IO.Path]::GetExtension($iconName).ToLower()
            if ($extension -eq ".ico") {
                Write-Host "Icone ICO trouvee (PARFAIT): $iconName" -ForegroundColor Green
            } else {
                Write-Host "Icone PNG trouvee (peut ne pas fonctionner): $iconName" -ForegroundColor Yellow
            }
            return $iconPath
        }
    }
    
    # Si aucune icône personnalisée, utiliser une icône système professionnelle
    Write-Host "Aucune icone personnalisee trouvee, utilisation d'une icone systeme" -ForegroundColor Yellow
    return "shell32.dll,46"  # Icône de boîtes empilées
}

function Create-ProfessionalShortcut {
    param([string]$IconLocation)
    
    $shortcutPath = "$([Environment]::GetFolderPath('Desktop'))\$ShortcutName"
    $launcherPath = "$PSScriptRoot\$LauncherScript"
    
    if (-not (Test-Path $launcherPath)) {
        Write-Host "Script launcher non trouve: $launcherPath" -ForegroundColor Red
        return $false
    }
    
    try {
        Write-Host "Creation du raccourci professionnel..." -ForegroundColor Yellow
        
        # Supprimer l'ancien raccourci s'il existe
        if (Test-Path $shortcutPath) {
            Remove-Item $shortcutPath -Force
            Write-Host "Ancien raccourci supprime" -ForegroundColor Cyan
        }
        
        # Créer le nouveau raccourci
        $WshShell = New-Object -comObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($shortcutPath)
        $Shortcut.TargetPath = "powershell.exe"
        $Shortcut.Arguments = "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcherPath`""
        $Shortcut.WorkingDirectory = $PSScriptRoot
        $Shortcut.IconLocation = $IconLocation
        $Shortcut.Description = "$AppName - Gestion de Stock Intelligente (Mode Auto: Local/Cloud)"
        $Shortcut.WindowStyle = 1  # Normal window
        $Shortcut.Save()
        
        Write-Host "Raccourci cree avec succes !" -ForegroundColor Green
        Write-Host "Emplacement: $shortcutPath" -ForegroundColor Cyan
        Write-Host "Icone: $IconLocation" -ForegroundColor Cyan
        
        return $true
        
    } catch {
        Write-Host "Erreur lors de la creation du raccourci: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Force-DesktopRefresh {
    Write-Host "Rafraichissement force du bureau..." -ForegroundColor Yellow
    
    try {
        # Méthode 1: API Windows
        $signature = @'
[DllImport("Shell32.dll")] 
public static extern int SHChangeNotify(int eventId, int flags, IntPtr item1, IntPtr item2);
[DllImport("user32.dll")]
public static extern bool InvalidateRect(IntPtr hWnd, IntPtr lpRect, bool bErase);
[DllImport("user32.dll")]
public static extern IntPtr GetDesktopWindow();
'@
        $type = Add-Type -MemberDefinition $signature -Name ShellNotify -Namespace Win32 -PassThru
        
        # Notifier le changement d'icônes
        $type::SHChangeNotify(0x8000000, 0x1000, [IntPtr]::Zero, [IntPtr]::Zero)
        
        # Invalider le bureau
        $desktop = $type::GetDesktopWindow()
        $type::InvalidateRect($desktop, [IntPtr]::Zero, $true)
        
        # Méthode 2: Redémarrer l'explorateur si nécessaire
        Start-Sleep -Seconds 2
        
        # Méthode 3: F5 programmatique sur le bureau
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.SendKeys]::SendWait("{F5}")
        
        Write-Host "Bureau rafraichi !" -ForegroundColor Green
        
    } catch {
        Write-Host "Erreur lors du rafraichissement: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Essayez de faire F5 manuellement sur le bureau" -ForegroundColor Yellow
    }
}

# === LOGIQUE PRINCIPALE ===

if ($Help) {
    Show-Help
    return
}

Clear-Host
Write-Host "Forcer le Rafraichissement d'Icone - $AppName" -ForegroundColor Magenta
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

if ($ClearCache) {
    Clear-IconCache
    Write-Host ""
    Write-Host "Cache nettoye ! Relancez le script sans -ClearCache pour appliquer l'icone." -ForegroundColor Green
    Read-Host "Appuyez sur Entree pour fermer"
    return
}

# Processus complet de correction
Write-Host "Etape 1/4: Recherche de la meilleure icone..." -ForegroundColor Yellow
$bestIcon = Find-BestIcon
Write-Host "Icone selectionnee: $bestIcon" -ForegroundColor Cyan
Write-Host ""

Write-Host "Etape 2/4: Nettoyage du cache d'icones..." -ForegroundColor Yellow
Clear-IconCache
Write-Host ""

Write-Host "Etape 3/4: Creation du raccourci professionnel..." -ForegroundColor Yellow
$success = Create-ProfessionalShortcut -IconLocation $bestIcon
Write-Host ""

if ($success) {
    Write-Host "Etape 4/4: Rafraichissement force du bureau..." -ForegroundColor Yellow
    Force-DesktopRefresh
    Write-Host ""
    
    Write-Host "TERMINE ! Votre icone devrait maintenant s'afficher correctement." -ForegroundColor Green
    Write-Host ""
    Write-Host "Si l'icone n'apparait toujours pas:" -ForegroundColor Yellow
    Write-Host "1. Faites F5 sur le bureau"
    Write-Host "2. Redemarrez votre PC"
    Write-Host "3. Relancez ce script avec -ClearCache"
} else {
    Write-Host "Echec de la creation du raccourci." -ForegroundColor Red
}

Write-Host ""
Read-Host "Appuyez sur Entree pour fermer"