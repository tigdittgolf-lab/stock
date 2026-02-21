# Configuration des Variables d'Environnement Backend sur Vercel

## Variables Requises

Aller sur: https://vercel.com/habibbelkacemimosta-7724s-projects/backend/settings/environment-variables

### 1. Supabase Configuration (OBLIGATOIRE)

```
SUPABASE_URL=https://szgodrjglbpzkrksnroi.supabase.co
SUPABASE_ANON_KEY=<votre-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<votre-service-role-key>
```

### 2. Server Configuration

```
PORT=3005
NODE_ENV=production
```

### 3. CORS Origins (optionnel - déjà configuré dans le code)

Le code backend accepte déjà toutes les URLs Vercel via regex.

## Étapes de Configuration

1. Aller sur https://vercel.com/habibbelkacemimosta-7724s-projects/backend/settings/environment-variables

2. Ajouter chaque variable:
   - Cliquer sur "Add New"
   - Nom: `SUPABASE_URL`
   - Valeur: `https://szgodrjglbpzkrksnroi.supabase.co`
   - Environnement: Cocher "Production", "Preview", "Development"
   - Cliquer sur "Save"

3. Répéter pour:
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NODE_ENV` (valeur: `production`)

4. Redéployer le backend:
   ```bash
   cd backend
   npx vercel --prod --force
   ```

## Mise à Jour du Frontend

Une fois le backend configuré, mettre à jour l'URL du backend dans le frontend:

### Dans les routes API frontend

Remplacer:
```typescript
const backendUrl = `${process.env.NODE_ENV === 'production' ? 'https://desktop-bhhs068.tail1d9c54.ts.net' : 'http://localhost:3005'}/api/...`;
```

Par:
```typescript
const backendUrl = `${process.env.NODE_ENV === 'production' ? 'https://backend-j9xqorpps-habibbelkacemimosta-7724s-projects.vercel.app' : 'http://localhost:3005'}/api/...`;
```

### Fichiers à modifier

- `frontend/app/api/articles/route.ts`
- `frontend/app/api/articles/[id]/route.ts`
- `frontend/app/api/settings/families/route.ts`
- Tous les autres fichiers dans `frontend/app/api/`

## URL Backend Déployé

**Production**: https://backend-j9xqorpps-habibbelkacemimosta-7724s-projects.vercel.app

**Health Check**: https://backend-j9xqorpps-habibbelkacemimosta-7724s-projects.vercel.app/health

## Test du Backend

```bash
curl https://backend-j9xqorpps-habibbelkacemimosta-7724s-projects.vercel.app/health
```

Devrait retourner:
```json
{
  "status": "OK",
  "timestamp": "2026-02-21T..."
}
```
