# Script de configuration des variables d'environnement Vercel
Write-Host "🔧 Configuration des variables d'environnement Vercel..." -ForegroundColor Cyan

cd frontend

# Liste des variables à configurer
$envVars = @{
    "NEXT_PUBLIC_SUPABASE_URL" = "https://szgodrjglbpzkrksnroi.supabase.co"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg"
    "SUPABASE_SERVICE_ROLE_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU"
    "JWT_SECRET" = "St_Article_2025_Super_Secret_JWT_Key_256_Bits_Production_Ready_Token_Security"
    "NEXT_PUBLIC_API_URL" = "https://frontend-dcay82cpv-tigdittgolf-9191s-projects.vercel.app/api"
    "NODE_ENV" = "production"
}

Write-Host "`n📋 Variables à configurer:" -ForegroundColor Yellow
foreach ($key in $envVars.Keys) {
    Write-Host "  - $key" -ForegroundColor White
}

Write-Host "`n⚠️  IMPORTANT: Vous devez configurer ces variables manuellement dans le dashboard Vercel" -ForegroundColor Red
Write-Host "🌐 URL: https://vercel.com/tigdittgolf-9191s-projects/frontend/settings/environment-variables" -ForegroundColor Cyan

Write-Host "`n✅ Toutes les valeurs sont disponibles dans le fichier VERCEL_ENV_SETUP.md" -ForegroundColor Green
