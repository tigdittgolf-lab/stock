# Script pour configurer les variables d'environnement Vercel pour le backend

Write-Host "Configuration des variables d'environnement Vercel pour le backend..." -ForegroundColor Green

# SUPABASE_SERVICE_ROLE_KEY
Write-Host "`nAjout de SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Yellow
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production

# NODE_ENV
Write-Host "`nAjout de NODE_ENV..." -ForegroundColor Yellow
echo "production" | npx vercel env add NODE_ENV production

# PORT
Write-Host "`nAjout de PORT..." -ForegroundColor Yellow
echo "3005" | npx vercel env add PORT production

# JWT_SECRET
Write-Host "`nAjout de JWT_SECRET..." -ForegroundColor Yellow
echo "4b5546596ba4ffc0d9a9e404ff6d890e3e9b72c6248ead0b08b8c1e124974e89" | npx vercel env add JWT_SECRET production

Write-Host "`n✅ Configuration terminée!" -ForegroundColor Green
Write-Host "Redéployez maintenant avec: npx vercel --prod --force" -ForegroundColor Cyan
