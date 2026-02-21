# Configuration des Variables d'Environnement Vercel

## Frontend

Aller sur: https://vercel.com/habibbelkacemimosta-7724s-projects/frontend/settings/environment-variables

Ajouter les variables suivantes:

```
NEXT_PUBLIC_BACKEND_URL=https://backend-j9xqorpps-habibbelkacemimosta-7724s-projects.vercel.app
SUPABASE_URL=https://szgodrjglbpzkrksnroi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU
```

## Backend

Aller sur: https://vercel.com/habibbelkacemimosta-7724s-projects/backend/settings/environment-variables

Ajouter les variables suivantes:

```
SUPABASE_URL=https://szgodrjglbpzkrksnroi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.Yx5Yx5Yx5Yx5Yx5Yx5Yx5Yx5Yx5Yx5Yx5Yx5Yx5Yx5
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU
NODE_ENV=production
PORT=3005
```

## Étapes

1. **Frontend**: Ajouter les 3 variables ci-dessus
2. **Backend**: Ajouter les 5 variables ci-dessus
3. Redéployer les deux projets:
   ```bash
   cd frontend && npx vercel --prod --force
   cd ../backend && npx vercel --prod --force
   ```

## URLs Déployées

- **Frontend**: https://frontend-feves5tew-habibbelkacemimosta-7724s-projects.vercel.app
- **Backend**: https://backend-j9xqorpps-habibbelkacemimosta-7724s-projects.vercel.app
- **Backend Health**: https://backend-j9xqorpps-habibbelkacemimosta-7724s-projects.vercel.app/health

## Test

Une fois les variables configurées et les projets redéployés, tester:

1. Backend health check:
   ```bash
   curl https://backend-j9xqorpps-habibbelkacemimosta-7724s-projects.vercel.app/health
   ```

2. Frontend: Ouvrir https://frontend-feves5tew-habibbelkacemimosta-7724s-projects.vercel.app et essayer de consulter un article
