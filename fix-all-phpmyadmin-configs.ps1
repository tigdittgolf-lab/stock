# =====================================================
# FORCER LE PORT 3307 DANS TOUS LES phpMyAdmin
# =====================================================

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURATION FORCEE phpMyAdmin - PORT 3307          " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# Trouver tous les fichiers config.inc.php
$configFiles = Get-ChildItem -Path "C:\wamp64\apps" -Filter "config.inc.php" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "setup" }

Write-Host "Fichiers config.inc.php trouves: $($configFiles.Count)" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $configFiles) {
    Write-Host "Traitement: $($file.FullName)" -ForegroundColor Cyan
    
    # Lire le contenu
    $content = Get-Content $file.FullName -Raw
    
    # Créer une sauvegarde
    $backupFile = $file.FullName + ".backup_" + (Get-Date -Format "yyyyMMdd_HHmmss")
    Copy-Item $file.FullName $backupFile
    Write-Host "  Sauvegarde: $backupFile" -ForegroundColor Gray
    
    # Chercher la section serveur
    if ($content -match "\`$cfg\['Servers'\]\[\`$i\]") {
        Write-Host "  Configuration serveur trouvee" -ForegroundColor Green
        
        # Vérifier si le port existe déjà
        if ($content -match "\`$cfg\['Servers'\]\[\`$i\]\['port'\]") {
            Write-Host "  Port existant trouve, modification..." -ForegroundColor Yellow
            # Remplacer le port existant
            $content = $content -replace "(\`$cfg\['Servers'\]\[\`$i\]\['port'\]\s*=\s*)'?\d+'?;", "`$1'3307';"
        } else {
            Write-Host "  Pas de port defini, ajout..." -ForegroundColor Yellow
            # Ajouter le port après la ligne host
            $content = $content -replace "(\`$cfg\['Servers'\]\[\`$i\]\['host'\]\s*=\s*'[^']*';)", "`$1`n`$cfg['Servers'][`$i]['port'] = '3307';"
        }
        
        # Sauvegarder
        Set-Content $file.FullName $content -NoNewline
        Write-Host "  OK Fichier modifie!" -ForegroundColor Green
    } else {
        Write-Host "  ATTENTION: Structure non reconnue" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   VERIFICATION                                         " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# Vérifier les modifications
foreach ($file in $configFiles) {
    $content = Get-Content $file.FullName -Raw
    Write-Host "$($file.Name):" -ForegroundColor White
    
    if ($content -match "\['port'\]\s*=\s*'?(\d+)'?") {
        $port = $matches[1]
        if ($port -eq "3307") {
            Write-Host "  Port: $port OK" -ForegroundColor Green
        } else {
            Write-Host "  Port: $port ERREUR" -ForegroundColor Red
        }
    } else {
        Write-Host "  Port: non trouve" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   INSTRUCTIONS FINALES                                 " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

Write-Host "1. Redemarrer WAMP:" -ForegroundColor Yellow
Write-Host "   Clic droit sur WAMP > Restart All Services" -ForegroundColor White
Write-Host ""
Write-Host "2. Ouvrir phpMyAdmin:" -ForegroundColor Yellow
Write-Host "   http://localhost/phpmyadmin" -ForegroundColor White
Write-Host ""
Write-Host "3. Si ca ne fonctionne toujours pas:" -ForegroundColor Yellow
Write-Host "   - Verifier quelle version de phpMyAdmin est active" -ForegroundColor White
Write-Host "   - Clic droit WAMP > Tools > Change phpMyAdmin version" -ForegroundColor White
Write-Host ""

Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
