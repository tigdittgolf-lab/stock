# Script de vérification avant test

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         VÉRIFICATION AVANT TEST                              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# 1. Vérifier MySQL sur port 3306
Write-Host "1. Vérification MySQL (port 3306)..." -ForegroundColor Yellow
try {
    $result = mysql -u root -P 3306 -e "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ MySQL accessible sur le port 3306" -ForegroundColor Green
    } else {
        Write-Host "   ❌ MySQL non accessible sur le port 3306" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "   ❌ Erreur lors de la connexion à MySQL" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# 2. Vérifier la base stock_management
Write-Host "2. Vérification base stock_management..." -ForegroundColor Yellow
try {
    $result = mysql -u root -P 3306 -e "USE stock_management; SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Base stock_management existe" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Base stock_management n'existe pas" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "   ❌ Erreur lors de la vérification de la base" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# 3. Vérifier la table payments
Write-Host "3. Vérification table payments..." -ForegroundColor Yellow
try {
    $result = mysql -u root -P 3306 -e "SELECT COUNT(*) as total FROM payments;" stock_management 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Table payments existe" -ForegroundColor Green
        mysql -u root -P 3306 -e "SELECT COUNT(*) as 'Nombre de paiements' FROM payments;" stock_management
    } else {
        Write-Host "   ❌ Table payments n'existe pas" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "   ❌ Erreur lors de la vérification de la table" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# 4. Vérifier les fichiers modifiés
Write-Host "4. Vérification fichiers modifiés..." -ForegroundColor Yellow
$files = @(
    "frontend/lib/database/payment-adapter.ts",
    "frontend/app/api/payments/route.ts",
    "frontend/components/payments/PaymentForm.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file manquant" -ForegroundColor Red
        $allGood = $false
    }
}
Write-Host ""

# 5. Vérifier que le port 3306 est utilisé dans payment-adapter.ts
Write-Host "5. Vérification port 3306 dans payment-adapter.ts..." -ForegroundColor Yellow
$content = Get-Content "frontend/lib/database/payment-adapter.ts" -Raw
if ($content -match "port.*3306") {
    Write-Host "   ✅ Port 3306 configuré" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Port 3306 non trouvé (vérifier manuellement)" -ForegroundColor Yellow
}
Write-Host ""

# Résultat final
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "║         ✅ TOUT EST PRÊT POUR LE TEST                        ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Vous pouvez maintenant exécuter :" -ForegroundColor White
    Write-Host "   .\restart-and-test.ps1" -ForegroundColor Cyan
} else {
    Write-Host "║         ❌ PROBLÈMES DÉTECTÉS                                ║" -ForegroundColor Red
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Veuillez corriger les problèmes ci-dessus avant de tester." -ForegroundColor Red
}
Write-Host ""
