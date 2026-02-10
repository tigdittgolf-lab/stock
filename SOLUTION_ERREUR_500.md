# Solution Erreur 500 - Routes API

## Problème identifié

Les routes API retournent 500 en production car `BACKEND_URL` est mal configuré dans Vercel.

### Configuration actuelle (INCORRECTE)
```
BACKEND_URL=https://desktop-bhhs068.tail1d9c54.ts.net/api
```

### Ce qui se passe
1. Frontend appelle: `${BACKEND_URL}/api/sales/articles`
2. URL construite: `https://desktop-bhhs068.tail1d9c54.ts.net/api/api/sales/articles` ❌
3. Tailscale route `/api` vers le backend et enlève le préfixe
4. Backend reçoit: `/api/sales/articles` (correct)
5. Mais l'URL a un `/api` en trop au début!

### Configuration correcte
```
BACKEND_URL=https://desktop-bhhs068.tail1d9c54.ts.net
```

### Ce qui se passera
1. Frontend appelle: `${BACKEND_URL}/api/sales/articles`
2. URL construite: `https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/articles` ✅
3. Tailscale route `/api` vers le backend et enlève le préfixe
4. Backend reçoit: `/sales/articles` ✅
5. Backend a la route `/api/sales` qui gère `/sales/articles` ✅

## Configuration Tailscale Funnel

```
https://desktop-bhhs068.tail1d9c54.ts.net (Funnel on)
|-- /      proxy http://127.0.0.1:443
|-- /api   proxy http://127.0.0.1:3005
|-- /mysql proxy http://127.0.0.1:3308
```

Quand Tailscale reçoit une requête sur `/api/xxx`, il:
1. Enlève le préfixe `/api`
2. Envoie `/xxx` au port 3005

## Action à faire

### Dans Vercel
1. Aller sur https://vercel.com
2. Sélectionner le projet
3. Aller dans "Settings" → "Environment Variables"
4. Modifier `BACKEND_URL`:
   - **Ancienne valeur**: `https://desktop-bhhs068.tail1d9c54.ts.net/api`
   - **Nouvelle valeur**: `https://desktop-bhhs068.tail1d9c54.ts.net`
5. Redéployer l'application

### Test après modification
```powershell
# Tester depuis PowerShell
$headers = @{"X-Tenant"="2025_bu01"}
Invoke-WebRequest -Uri "https://frontend-fmmokvp8g-habibbelkacemimosta-7724s-projects.vercel.app/api/sales/articles" -Headers $headers -UseBasicParsing
```

**Résultat attendu**: 200 OK avec 4 articles

## Autres problèmes corrigés

### 1. Auto-correction désactivée
Le composant `DatabaseTypeIndicator` forçait automatiquement le frontend à utiliser la même base que le backend. Cela a été désactivé.

**Avant**:
```typescript
if (!isSync) {
  console.log(`🔧 Auto-correction: Frontend (${frontendType}) → Backend (${backendType})`);
  setIsAutoFixing(true);
  await autoFixSynchronization(backendType);
  setIsAutoFixing(false);
}
```

**Après**:
```typescript
if (!isSync) {
  console.warn(`⚠️ Désynchronisation détectée: Frontend (${frontendType}) ≠ Backend (${backendType})`);
  console.warn(`💡 Utilisez le sélecteur de base de données pour changer manuellement`);
  // Ne pas forcer l'auto-correction
}
```

### 2. Routes API uniformisées
Toutes les routes utilisent maintenant `process.env.BACKEND_URL`:
- `frontend/app/api/sales/suppliers/route.ts`
- `frontend/app/api/sales/clients/route.ts`
- `frontend/app/api/sales/articles/route.ts`

## Résumé

| Variable | Ancienne valeur | Nouvelle valeur |
|----------|----------------|-----------------|
| `BACKEND_URL` | `https://desktop-bhhs068.tail1d9c54.ts.net/api` | `https://desktop-bhhs068.tail1d9c54.ts.net` |

Cette simple modification devrait résoudre toutes les erreurs 500 en production.
