# Sélecteur d'icônes pour Stock Management

Clear-Host
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   Choisir l'Icone Stock Management" -ForegroundColor Cyan  
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Définir les icônes disponibles
$icons = @{
    "1" = @{Name="Boites empilees (Entrepot)"; Path="shell32.dll,46"}
    "2" = @{Name="Graphiques et statistiques"; Path="shell32.dll,247"}  
    "3" = @{Name="Dossier reseau/Base de donnees"; Path="shell32.dll,275"}
    "4" = @{Name="Calculatrice/Gestion"; Path="shell32.dll,23"}
    "5" = @{Name="Outils/Configuration"; Path="imageres.dll,109"}
    "6" = @{Name="Dossier avec etoile"; Path="shell32.dll,43"}
    "7" = @{Name="Graphique camembert"; Path="imageres.dll,170"}
}

Write-Host "Quelle icone preferez-vous ?" -ForegroundColor Yellow
Write-Host ""

# Afficher les options
foreach ($key in $icons.Keys | Sort-Object) {
    Write-Host "$key. $($icons[$key].Name)" -ForegroundColor White
}

Write-Host ""
$choice = Read-Host "Votre choix (1-7)"

if ($icons.ContainsKey($choice)) {
    $selectedIcon = $icons[$choice]
    
    Write-Host ""
    Write-Host "Mise a jour de l'icone: $($selectedIcon.Name)..." -ForegroundColor Yellow
    
    # Chemin du raccourci
    $shortcutPath = "$([Environment]::GetFolderPath('Desktop'))\Stock Management.lnk"
    
    try {
        # Mettre à jour l'icône
        $WshShell = New-Object -comObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($shortcutPath)
        $Shortcut.IconLocation = $selectedIcon.Path
        $Shortcut.Save()
        
        Write-Host ""
        Write-Host "Icone mise a jour avec succes !" -ForegroundColor Green
        Write-Host "Nouvelle icone: $($selectedIcon.Name)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Si l'icone ne change pas immediatement:" -ForegroundColor Yellow
        Write-Host "1. Faites F5 sur le desktop" -ForegroundColor White
        Write-Host "2. Ou redemarrez l'explorateur Windows" -ForegroundColor White
        
    } catch {
        Write-Host ""
        Write-Host "Erreur lors de la mise a jour: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} else {
    Write-Host ""
    Write-Host "Choix invalide. Utilisez un numero entre 1 et 7." -ForegroundColor Red
}

Write-Host ""
Read-Host "Appuyez sur Entree pour continuer"