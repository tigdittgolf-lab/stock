# Script PowerShell pour configurer les variables d'environnement Vercel
# Usage: .\setup-vercel-env.ps1

Write-Host "🚀 Configuration des variables d'environnement Vercel..." -ForegroundColor Green
Write-Host ""

# Vérifier si vercel CLI est installé
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI n'est pas installé" -ForegroundColor Red
    Write-Host "📦 Installation: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Vercel CLI détecté" -ForegroundColor Green
Write-Host ""

# Se connecter à Vercel
Write-Host "🔐 Connexion à Vercel..." -ForegroundColor Cyan
vercel login

Write-Host ""
Write-Host "📝 Ajout des variables d'environnement..." -ForegroundColor Cyan
Write-Host ""

# NEXT_PUBLIC_SUPABASE_URL
Write-Host "1/4 - NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Yellow
"https://szgodrjglbpzkrksnroi.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
"https://szgodrjglbpzkrksnroi.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview
"https://szgodrjglbpzkrksnroi.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL development

# SUPABASE_SERVICE_ROLE_KEY
Write-Host "2/4 - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU" | vercel env add SUPABASE_SERVICE_ROLE_KEY production
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU" | vercel env add SUPABASE_SERVICE_ROLE_KEY preview
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU" | vercel env add SUPABASE_SERVICE_ROLE_KEY development

# NEXT_PUBLIC_SUPABASE_ANON_KEY
Write-Host "3/4 - NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Yellow
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development

# SUPABASE_URL (sans NEXT_PUBLIC)
Write-Host "4/4 - SUPABASE_URL" -ForegroundColor Yellow
"https://szgodrjglbpzkrksnroi.supabase.co" | vercel env add SUPABASE_URL production
"https://szgodrjglbpzkrksnroi.supabase.co" | vercel env add SUPABASE_URL preview
"https://szgodrjglbpzkrksnroi.supabase.co" | vercel env add SUPABASE_URL development

Write-Host ""
Write-Host "✅ Variables d'environnement configurées!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Vérification..." -ForegroundColor Cyan
vercel env ls

Write-Host ""
Write-Host "🚀 Redéploiement en production..." -ForegroundColor Cyan
vercel --prod

Write-Host ""
Write-Host "✅ Configuration terminée!" -ForegroundColor Green
Write-Host "🌐 Votre application sera disponible dans 2-3 minutes" -ForegroundColor Cyan
