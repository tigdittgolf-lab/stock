# Creation d'un raccourci fonctionnel pour Stock Management

$AppName = "Stock Management"
$ShortcutName = "Stock Management.lnk"
$LauncherScript = "Stock-Management-Simple.ps1"

function Create-WorkingShortcut {
    $shortcutPath = "$([Environment]::GetFolderPath('Desktop'))\$ShortcutName"
    $launcherPath = "$PSScriptRoot\$LauncherScript"
    
    Write-Host "Creation d'un raccourci fonctionnel..." -ForegroundColor Yellow
    Write-Host "Launcher: $launcherPath" -ForegroundColor Cyan
    
    if (-not (Test-Path $launcherPath)) {
        Write-Host "ERREUR: Launcher non trouve: $launcherPath" -ForegroundColor Red
        return $false
    }
    
    try {
        # Supprimer l'ancien raccourci
        if (Test-Path $shortcutPath) {
            Remove-Item $shortcutPath -Force
            Write-Host "Ancien raccourci supprime" -ForegroundColor Green
        }
        
        # Creer le nouveau raccourci SANS WindowStyle Hidden
        $WshShell = New-Object -comObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($shortcutPath)
        $Shortcut.TargetPath = "powershell.exe"
        $Shortcut.Arguments = "-ExecutionPolicy Bypass -NoExit -File `"$launcherPath`""
        $Shortcut.WorkingDirectory = $PSScriptRoot
        $Shortcut.IconLocation = "shell32.dll,46"  # Icone systeme fiable
        $Shortcut.Description = "$AppName - Application de Gestion de Stock"
        $Shortcut.WindowStyle = 1  # Fenetre normale (pas cachee)
        $Shortcut.Save()
        
        Write-Host "SUCCES ! Raccourci fonctionnel cree !" -ForegroundColor Green
        Write-Host "Emplacement: $shortcutPath" -ForegroundColor Cyan
        Write-Host "Le raccourci s'ouvrira maintenant dans une fenetre visible" -ForegroundColor Green
        
        return $true
        
    } catch {
        Write-Host "ERREUR: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Execution
Clear-Host
Write-Host "Creation d'un Raccourci Fonctionnel - $AppName" -ForegroundColor Magenta
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

$success = Create-WorkingShortcut

if ($success) {
    Write-Host ""
    Write-Host "TERMINE ! Testez maintenant le raccourci sur votre bureau." -ForegroundColor Green
    Write-Host "Il devrait s'ouvrir dans une fenetre PowerShell visible." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Le launcher detectera automatiquement le meilleur mode:" -ForegroundColor Cyan
    Write-Host "- Mode Local si pas d'Internet ou backend deja en marche" -ForegroundColor Cyan
    Write-Host "- Mode Cloud si Internet + backend disponible" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "ECHEC de la creation du raccourci." -ForegroundColor Red
}

Write-Host ""
Read-Host "Appuyez sur Entree pour fermer"