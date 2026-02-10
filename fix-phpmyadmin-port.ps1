# =====================================================
# CONFIGURER phpMyAdmin POUR LE PORT 3307
# =====================================================

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURATION phpMyAdmin - PORT 3307                 " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# Chercher le fichier config.inc.php
Write-Host "1. Recherche du fichier config.inc.php..." -ForegroundColor Yellow

$configFiles = Get-ChildItem -Path "C:\wamp64" -Filter "config.inc.php" -Recurse -ErrorAction SilentlyContinue

if ($configFiles.Count -eq 0) {
    Write-Host "   ERREUR: Fichier config.inc.php non trouve!" -ForegroundColor Red
    Write-Host "   Verifiez que WAMP est installe dans C:\wamp64" -ForegroundColor Yellow
    exit 1
}

Write-Host "   OK Fichier(s) trouve(s):" -ForegroundColor Green
$configFiles | ForEach-Object {
    Write-Host "   - $($_.FullName)" -ForegroundColor Gray
}

# Utiliser le premier fichier trouvé (généralement le bon)
$configFile = $configFiles[0].FullName
Write-Host "`n2. Fichier selectionne:" -ForegroundColor Yellow
Write-Host "   $configFile" -ForegroundColor White

# Lire le contenu
Write-Host "`n3. Lecture du fichier..." -ForegroundColor Yellow
$content = Get-Content $configFile -Raw

# Vérifier le port actuel
if ($content -match "port.*=.*'(\d+)'") {
    $currentPort = $matches[1]
    Write-Host "   Port actuel: $currentPort" -ForegroundColor Gray
} else {
    Write-Host "   Port non trouve dans le fichier" -ForegroundColor Yellow
}

# Créer une sauvegarde
Write-Host "`n4. Creation d'une sauvegarde..." -ForegroundColor Yellow
$backupFile = $configFile + ".backup_" + (Get-Date -Format "yyyyMMdd_HHmmss")
Copy-Item $configFile $backupFile
Write-Host "   OK Sauvegarde: $backupFile" -ForegroundColor Green

# Modifier le port
Write-Host "`n5. Modification du port..." -ForegroundColor Yellow

# Remplacer toutes les occurrences de port 3306 par 3307
$newContent = $content -replace "(\['port'\]\s*=\s*)'3306'", "`$1'3307'"
$newContent = $newContent -replace "(\['port'\]\s*=\s*)3306", "`$13307"

# Sauvegarder
Set-Content $configFile $newContent -NoNewline

Write-Host "   OK Port change de 3306 vers 3307" -ForegroundColor Green

# Vérifier la modification
Write-Host "`n6. Verification..." -ForegroundColor Yellow
$verifyContent = Get-Content $configFile -Raw
if ($verifyContent -match "port.*=.*'3307'") {
    Write-Host "   OK Port 3307 configure!" -ForegroundColor Green
} else {
    Write-Host "   ATTENTION: Verification manuelle necessaire" -ForegroundColor Yellow
}

# Instructions finales
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURATION TERMINEE                               " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

Write-Host "PROCHAINES ETAPES:" -ForegroundColor Yellow
Write-Host "1. Redemarrer les services WAMP:" -ForegroundColor White
Write-Host "   - Clic droit sur WAMP > Restart All Services" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Ouvrir phpMyAdmin:" -ForegroundColor White
Write-Host "   http://localhost/phpmyadmin" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Verifier la table payments:" -ForegroundColor White
Write-Host "   - Base: stock_management" -ForegroundColor Gray
Write-Host "   - Table: payments" -ForegroundColor Gray
Write-Host "   - Vous devriez voir 6 paiements!" -ForegroundColor Gray
Write-Host ""
Write-Host "SAUVEGARDE:" -ForegroundColor Yellow
Write-Host "   $backupFile" -ForegroundColor Gray
Write-Host ""

Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
