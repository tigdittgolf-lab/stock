# Télécharger une icône de stock management depuis une source libre

$iconUrls = @(
    "https://cdn-icons-png.flaticon.com/512/3659/3659898.png",  # Boîtes empilées
    "https://cdn-icons-png.flaticon.com/512/2920/2920277.png",  # Entrepôt
    "https://cdn-icons-png.flaticon.com/512/1170/1170576.png",  # Graphique stock
    "https://cdn-icons-png.flaticon.com/512/3176/3176366.png"   # Inventaire
)

Write-Host "📥 Téléchargement d'icônes de stock management..." -ForegroundColor Cyan

foreach ($i in 0..($iconUrls.Length-1)) {
    $url = $iconUrls[$i]
    $filename = "stock-icon-$($i+1).png"
    
    try {
        Write-Host "⬇️ Téléchargement $filename..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $url -OutFile $filename -UseBasicParsing
        Write-Host "✅ $filename téléchargé !" -ForegroundColor Green
    } catch {
        Write-Host "❌ Échec $filename : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎨 Icônes téléchargées ! Vous pouvez maintenant :" -ForegroundColor Green
Write-Host "1. Convertir en .ico avec un outil en ligne" -ForegroundColor White
Write-Host "2. Ou utiliser directement le PNG dans le raccourci" -ForegroundColor White