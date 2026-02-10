# Corrections Routes API - Session du 10 février 2026

## Problèmes identifiés

### 1. Routes API proxy avec URLs incorrectes
- **suppliers/route.ts**: Utilisait `/suppliers` au lieu de `/api/sales/suppliers`
- **clients/route.ts**: URL Tailscale hardcodée au lieu de `process.env.BACKEND_URL`
- **articles/route.ts**: URL Tailscale hardcodée + mauvaise URL (`/articles` au lieu de `/api/sales/articles`)

### 2. Erreurs 500/502 en production
- Le frontend ne pouvait pas accéder aux articles/clients/fournisseurs
- Cause: URLs incorrectes et non-utilisation de la variable d'environnement

### 3. Paiements allant dans Supabase au lieu de MySQL
- L'utilisateur sélectionnait MySQL dans l'interface
- Mais les paiements étaient créés dans Supabase
- Cause probable: localStorage non synchronisé ou header non envoyé

## Corrections effectuées

### 1. Uniformisation des routes API proxy

**Avant (articles/route.ts)**:
```typescript
const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://desktop-bhhs068.tail1d9c54.ts.net/api'
  : 'http://localhost:3005/api';

const backendResponse = await fetch(`${BACKEND_URL}/articles`, {
```

**Après**:
```typescript
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3005';

const backendResponse = await fetch(`${BACKEND_URL}/api/sales/articles`, {
```

### 2. Correction de payment-adapter.ts

**Avant**:
```typescript
if (process.env.VERCEL && (explicitType === 'mysql' || explicitType === 'postgresql')) {
  if (process.env.MYSQL_PROXY_URL) {
    return 'mysql'; // ❌ Toujours MySQL même si PostgreSQL demandé
  }
}
```

**Après**:
```typescript
if (process.env.VERCEL && (explicitType === 'mysql' || explicitType === 'postgresql')) {
  if (process.env.MYSQL_PROXY_URL) {
    console.log(`✅ Production: Utilisation de ${explicitType} via Tailscale proxy`);
    return explicitType; // ✅ Retourne le type demandé
  }
}
```

### 3. Ajout de logs de débogage

**Dans POST /api/payments**:
```typescript
console.log('🔍 POST /api/payments - Headers:', {
  'X-Tenant': request.headers.get('X-Tenant'),
  'X-Database-Type': request.headers.get('X-Database-Type'),
  'Computed dbType': dbType,
  'Body tenantId': body.tenantId
});
```

**Dans PaymentForm.tsx**:
```typescript
console.log('🔍 PaymentForm - Submitting payment:', {
  dbConfig: dbConfig ? JSON.parse(dbConfig) : null,
  dbType,
  documentType,
  documentId
});
```

## Fichiers modifiés

1. `frontend/app/api/sales/suppliers/route.ts`
   - Utilise `process.env.BACKEND_URL`
   - URLs corrigées: `/api/sales/suppliers`

2. `frontend/app/api/sales/clients/route.ts`
   - Utilise `process.env.BACKEND_URL`
   - URLs corrigées: `/api/sales/clients`

3. `frontend/app/api/sales/articles/route.ts`
   - Utilise `process.env.BACKEND_URL`
   - URLs corrigées: `/api/sales/articles`

4. `frontend/lib/database/payment-adapter.ts`
   - Retourne le bon type de base de données (mysql/postgresql)
   - Logs améliorés

5. `frontend/app/api/payments/route.ts`
   - Logs de débogage ajoutés

6. `frontend/components/payments/PaymentForm.tsx`
   - Logs de débogage ajoutés

## Configuration Vercel requise

Variables d'environnement:
```
BACKEND_URL=https://desktop-bhhs068.tail1d9c54.ts.net/api
MYSQL_PROXY_URL=https://desktop-bhhs068.tail1d9c54.ts.net/mysql
```

## Prochaines étapes

1. **Déployer sur Vercel** et tester
2. **Vérifier les logs** dans la console du navigateur et Vercel
3. **Tester la création de paiements** avec MySQL sélectionné
4. **Vérifier que les articles/clients/fournisseurs** s'affichent en production

## Tests à effectuer

### En local
```powershell
# 1. Vérifier que le backend répond
curl http://localhost:3005/api/sales/articles -H "X-Tenant: 2025_bu01"

# 2. Vérifier que le proxy MySQL fonctionne
curl http://localhost:3308/health
```

### En production
1. Ouvrir la console du navigateur (F12)
2. Sélectionner MySQL dans le sélecteur de base de données
3. Vérifier le localStorage: `localStorage.getItem('activeDbConfig')`
4. Créer un paiement et observer les logs
5. Vérifier que le paiement est dans MySQL (pas Supabase)

## Diagnostic des problèmes de paiements

Si les paiements vont toujours dans Supabase:

1. **Vérifier localStorage**:
   ```javascript
   console.log(localStorage.getItem('activeDbConfig'));
   // Devrait afficher: {"type":"mysql",...}
   ```

2. **Vérifier le header envoyé**:
   - Ouvrir Network tab (F12)
   - Créer un paiement
   - Cliquer sur la requête POST /api/payments
   - Vérifier Headers → Request Headers → X-Database-Type

3. **Vérifier les logs serveur**:
   - Vercel: Aller dans Deployments → Logs
   - Chercher: "🔍 POST /api/payments - Headers"
   - Vérifier la valeur de `X-Database-Type`

## Notes importantes

- Le sélecteur de base de données recharge la page après changement
- Le localStorage est spécifique au domaine (localhost ≠ vercel.app)
- En production, il faut re-sélectionner la base de données après chaque déploiement
- Le proxy Tailscale doit être actif pour que MySQL fonctionne en production
