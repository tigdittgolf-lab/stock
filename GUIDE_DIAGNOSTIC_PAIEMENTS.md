# Guide de Diagnostic - Problème Paiements MySQL

## Symptôme
L'utilisateur sélectionne MySQL dans l'interface, mais les paiements sont créés dans Supabase.

## Causes possibles

### 1. localStorage non configuré ou incorrect
Le sélecteur de base de données sauvegarde la config dans `localStorage`, mais:
- Le localStorage est spécifique au domaine (localhost ≠ vercel.app)
- Il peut être effacé par le navigateur
- Il peut contenir une ancienne valeur

### 2. Header non envoyé ou mal lu
Le header `X-Database-Type` peut:
- Ne pas être envoyé par le client
- Être vide ou undefined
- Ne pas être lu correctement côté serveur

### 3. Valeur par défaut utilisée
Si le header est absent, le code utilise `'supabase'` par défaut:
```typescript
const dbType = (request.headers.get('X-Database-Type') as any) || 'supabase';
```

## Procédure de diagnostic

### Étape 1: Vérifier localStorage

#### Option A: Via la console du navigateur
1. Ouvrir l'application dans le navigateur
2. Appuyer sur F12 pour ouvrir DevTools
3. Aller dans l'onglet "Console"
4. Taper:
```javascript
localStorage.getItem('activeDbConfig')
```

**Résultat attendu**:
```json
{"type":"mysql","name":"MySQL Local","host":"localhost","port":3306,"database":"stock_management","username":"root","password":"","isActive":true,"lastTested":"2026-02-10T..."}
```

**Si le résultat est `null` ou contient `"type":"supabase"`**:
→ Le problème vient du localStorage

#### Option B: Via le fichier test HTML
1. Ouvrir `test-localstorage.html` dans le navigateur
2. Vérifier l'état actuel
3. Si nécessaire, cliquer sur "🐬 Configurer MySQL"
4. Retourner sur l'application

### Étape 2: Vérifier l'envoi du header

1. Ouvrir l'application dans le navigateur
2. Appuyer sur F12 → Onglet "Network"
3. Créer un paiement
4. Cliquer sur la requête `POST /api/payments`
5. Aller dans "Headers" → "Request Headers"
6. Chercher `X-Database-Type`

**Résultat attendu**: `X-Database-Type: mysql`

**Si le header est absent ou vaut `supabase`**:
→ Le problème vient du code client (PaymentForm.tsx)

### Étape 3: Vérifier les logs serveur

#### En local
1. Regarder la console où tourne `npm run dev`
2. Créer un paiement
3. Chercher les logs:
```
🔍 PaymentForm - Submitting payment: { dbConfig: {...}, dbType: 'mysql', ... }
🔍 POST /api/payments - Headers: { 'X-Database-Type': 'mysql', ... }
💰 Creating payment: { ..., dbType: 'mysql' }
```

#### En production (Vercel)
1. Aller sur https://vercel.com
2. Sélectionner le projet
3. Aller dans "Deployments" → Dernier déploiement → "Logs"
4. Créer un paiement
5. Chercher les mêmes logs

**Si `dbType` vaut `'supabase'` dans les logs**:
→ Le header n'est pas envoyé ou pas lu correctement

### Étape 4: Vérifier la base de données

#### MySQL
```sql
-- Se connecter à MySQL
mysql -u root -p

-- Vérifier la base
USE stock_management;

-- Compter les paiements
SELECT COUNT(*) FROM payments;

-- Voir les derniers paiements
SELECT * FROM payments ORDER BY id DESC LIMIT 5;
```

#### Supabase
1. Aller sur https://supabase.com
2. Ouvrir le projet
3. Aller dans "Table Editor" → "payments"
4. Vérifier si de nouveaux paiements apparaissent

## Solutions

### Solution 1: Réinitialiser localStorage

**En local**:
```javascript
// Dans la console du navigateur (F12)
localStorage.setItem('activeDbConfig', JSON.stringify({
  type: 'mysql',
  name: 'MySQL Local',
  host: 'localhost',
  port: 3306,
  database: 'stock_management',
  username: 'root',
  password: '',
  isActive: true,
  lastTested: new Date().toISOString()
}));
location.reload();
```

**En production**:
```javascript
// Dans la console du navigateur (F12)
localStorage.setItem('activeDbConfig', JSON.stringify({
  type: 'mysql',
  name: 'MySQL via Tailscale',
  isActive: true,
  lastTested: new Date().toISOString()
}));
location.reload();
```

### Solution 2: Utiliser le sélecteur de base de données

1. Aller sur le dashboard de l'application
2. Cliquer sur le bouton "🐬 MySQL (Local)"
3. La page se recharge automatiquement
4. Vérifier que le bouton MySQL est maintenant actif (bordure colorée)

### Solution 3: Vérifier le code

Si les solutions 1 et 2 ne fonctionnent pas, vérifier:

**PaymentForm.tsx** (ligne ~120):
```typescript
const dbConfig = localStorage.getItem('activeDbConfig');
const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';

console.log('🔍 PaymentForm - Submitting payment:', {
  dbConfig: dbConfig ? JSON.parse(dbConfig) : null,
  dbType,
  documentType,
  documentId
});
```

**route.ts** (ligne ~60):
```typescript
const dbType = (request.headers.get('X-Database-Type') as any) || 'supabase';

console.log('🔍 POST /api/payments - Headers:', {
  'X-Database-Type': request.headers.get('X-Database-Type'),
  'Computed dbType': dbType
});
```

## Checklist de vérification

- [ ] localStorage contient `"type":"mysql"`
- [ ] Le sélecteur affiche MySQL comme actif
- [ ] Le header `X-Database-Type: mysql` est envoyé
- [ ] Les logs client affichent `dbType: 'mysql'`
- [ ] Les logs serveur affichent `dbType: 'mysql'`
- [ ] Le paiement apparaît dans MySQL
- [ ] Le paiement n'apparaît PAS dans Supabase

## Notes importantes

### Différence local vs production

**En local**:
- localStorage: `http://localhost:3000`
- MySQL: Connexion directe via `mysql2`
- Pas besoin de proxy

**En production**:
- localStorage: `https://[votre-app].vercel.app`
- MySQL: Via proxy Tailscale
- Nécessite `MYSQL_PROXY_URL` configuré

### Pourquoi le localStorage est différent?

Le localStorage est isolé par domaine pour des raisons de sécurité:
- `localhost:3000` a son propre localStorage
- `vercel.app` a son propre localStorage
- Ils ne partagent AUCUNE donnée

**Conséquence**: Il faut configurer la base de données séparément en local et en production!

## Commandes utiles

### Vérifier MySQL local
```powershell
# Tester la connexion
mysql -u root -p -e "SELECT COUNT(*) FROM stock_management.payments;"

# Voir les derniers paiements
mysql -u root -p -e "SELECT * FROM stock_management.payments ORDER BY id DESC LIMIT 5;"
```

### Vérifier le proxy Tailscale
```powershell
# Tester le proxy
curl https://desktop-bhhs068.tail1d9c54.ts.net/mysql/health

# Tester une requête
curl -X POST https://desktop-bhhs068.tail1d9c54.ts.net/mysql/api/mysql/query `
  -H "Content-Type: application/json" `
  -d '{"sql":"SELECT COUNT(*) as count FROM payments","params":[],"database":"stock_management"}'
```

### Vérifier Vercel
```powershell
# Voir les variables d'environnement
vercel env ls

# Voir les logs en temps réel
vercel logs --follow
```

## Contact et support

Si le problème persiste après avoir suivi ce guide:
1. Copier tous les logs (client + serveur)
2. Faire une capture d'écran du localStorage
3. Faire une capture d'écran du Network tab
4. Vérifier les deux bases de données (MySQL et Supabase)
5. Fournir toutes ces informations pour diagnostic approfondi
