# Script pour configurer les variables d'environnement Vercel pour le frontend

Write-Host "Configuration des variables d'environnement Vercel pour le frontend..." -ForegroundColor Green

# NEXT_PUBLIC_BACKEND_URL
Write-Host "`nAjout de NEXT_PUBLIC_BACKEND_URL..." -ForegroundColor Yellow
echo "https://backend-j9xqorpps-habibbelkacemimosta-7724s-projects.vercel.app" | npx vercel env add NEXT_PUBLIC_BACKEND_URL production

# SUPABASE_URL
Write-Host "`nAjout de SUPABASE_URL..." -ForegroundColor Yellow
echo "https://szgodrjglbpzkrksnroi.supabase.co" | npx vercel env add SUPABASE_URL production

# SUPABASE_SERVICE_ROLE_KEY
Write-Host "`nAjout de SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Yellow
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production

Write-Host "`n✅ Configuration terminée!" -ForegroundColor Green
Write-Host "Redéployez maintenant avec: npx vercel --prod --force" -ForegroundColor Cyan
