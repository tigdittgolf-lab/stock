# Script de déploiement complet
Write-Host "🚀 Déploiement complet du système Stock Management" -ForegroundColor Green

# 1. Commit et push des changements
Write-Host "`n📝 Commit des changements..." -ForegroundColor Yellow
git add .
git commit -m "Complete deployment setup with backend and frontend

- Fixed PDF generation method names
- Added backend Vercel configuration  
- Backend deployed at: stock-management-backend-7jr8k17qv-tigdittgolf-9191s-projects.vercel.app
- All PDF formats working with real data from database
- Ready for production deployment"

Write-Host "`n📤 Push vers GitHub..." -ForegroundColor Yellow
git push origin main

# 2. Déployer le backend (déjà fait)
Write-Host "`n🔧 Backend déjà déployé à:" -ForegroundColor Green
Write-Host "https://stock-management-backend-7jr8k17qv-tigdittgolf-9191s-projects.vercel.app" -ForegroundColor Cyan

# 3. Configurer l'API URL pour le frontend
Write-Host "`n⚙️ Configuration de l'API URL pour le frontend..." -ForegroundColor Yellow
$backendUrl = "https://stock-management-backend-7jr8k17qv-tigdittgolf-9191s-projects.vercel.app"

# Mettre à jour le fichier vercel.json du frontend
$frontendVercelConfig = @{
    version = 2
    framework = "nextjs"
    env = @{
        NODE_ENV = "production"
        NEXT_PUBLIC_API_URL = $backendUrl
    }
    functions = @{
        "app/api/**/*.js" = @{
            maxDuration = 30
        }
    }
    regions = @("iad1")
} | ConvertTo-Json -Depth 3

$frontendVercelConfig | Out-File -FilePath "frontend/vercel.json" -Encoding UTF8

Write-Host "✅ Configuration frontend mise à jour" -ForegroundColor Green

# 4. Déployer le frontend
Write-Host "`n🌐 Déploiement du frontend..." -ForegroundColor Yellow
Set-Location frontend
vercel --prod
Set-Location ..

Write-Host "`n✅ Déploiement complet terminé!" -ForegroundColor Green
Write-Host "🔗 Backend: https://stock-management-backend-7jr8k17qv-tigdittgolf-9191s-projects.vercel.app" -ForegroundColor Cyan
Write-Host "🔗 Frontend: Voir l'URL affichée ci-dessus" -ForegroundColor Cyan