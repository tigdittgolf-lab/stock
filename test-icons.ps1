# Test rapide de toutes les icônes

$icons = @(
    @{Name="Boites empilees"; Path="shell32.dll,46"},
    @{Name="Graphiques stats"; Path="shell32.dll,247"},  
    @{Name="Dossier reseau"; Path="shell32.dll,275"},
    @{Name="Calculatrice"; Path="shell32.dll,23"},
    @{Name="Outils config"; Path="imageres.dll,109"},
    @{Name="Dossier etoile"; Path="shell32.dll,43"},
    @{Name="Graphique camembert"; Path="imageres.dll,170"}
)

$shortcutPath = "$([Environment]::GetFolderPath('Desktop'))\Stock Management.lnk"
$WshShell = New-Object -comObject WScript.Shell

Write-Host "Test de toutes les icones (changement toutes les 3 secondes)..." -ForegroundColor Cyan

foreach ($icon in $icons) {
    Write-Host "Icone: $($icon.Name) - $($icon.Path)" -ForegroundColor Yellow
    
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.IconLocation = $icon.Path
    $Shortcut.Save()
    
    Start-Sleep -Seconds 3
}

Write-Host "Test termine ! Quelle icone preferez-vous ?" -ForegroundColor Green