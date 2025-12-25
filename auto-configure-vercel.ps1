# Configuration automatique Vercel avec variables existantes
Write-Host "🚀 Configuration automatique Vercel" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

# Variables depuis .env.local
$SUPABASE_URL = "https://szgodrjglbpzkrksnroi.supabase.co"
$SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU"

Write-Host "Variables detectees:" -ForegroundColor Green
Write-Host "- SUPABASE_URL: $SUPABASE_URL" -ForegroundColor Cyan
Write-Host "- SUPABASE_SERVICE_ROLE_KEY: [MASQUE]" -ForegroundColor Cyan

# Aller dans frontend
Set-Location frontend

Write-Host ""
Write-Host "Configuration des variables sur Vercel..." -ForegroundColor Yellow

# Configurer NODE_ENV
Write-Host "1. Configuration NODE_ENV = production" -ForegroundColor Green
echo "production" | vercel env add NODE_ENV production

# Configurer SUPABASE_URL
Write-Host "2. Configuration SUPABASE_URL" -ForegroundColor Green
echo $SUPABASE_URL | vercel env add SUPABASE_URL production

# Configurer SUPABASE_SERVICE_ROLE_KEY
Write-Host "3. Configuration SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Green
echo $SUPABASE_SERVICE_ROLE_KEY | vercel env add SUPABASE_SERVICE_ROLE_KEY production

Write-Host ""
Write-Host "✅ Variables configurees!" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Redeploiement en production..." -ForegroundColor Green
vercel --prod

Write-Host ""
Write-Host "🎯 Configuration terminee avec succes!" -ForegroundColor Green
Write-Host "📱 Application maintenant fonctionnelle en production" -ForegroundColor Green