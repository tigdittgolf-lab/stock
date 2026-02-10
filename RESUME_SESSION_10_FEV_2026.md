# Résumé Session - 10 février 2026

## Contexte
Suite à la session précédente où nous avons configuré Tailscale Funnel pour exposer le backend et MySQL en production, nous avons identifié plusieurs problèmes:

1. **Erreurs 500/502 en production** pour articles/clients/fournisseurs
2. **Paiements allant dans Supabase** au lieu de MySQL malgré la sélection dans l'interface
3. **Routes API avec URLs incorrectes**

## Problèmes identifiés et corrigés

### 1. Routes API proxy avec URLs incorrectes ✅

**Problème**:
- `suppliers/route.ts`: Utilisait `/suppliers` au lieu de `/api/sales/suppliers`
- `clients/route.ts`: URL Tailscale hardcodée au lieu de `process.env.BACKEND_URL`
- `articles/route.ts`: URL Tailscale hardcodée + mauvaise URL

**Solution**:
- Uniformisation: Toutes les routes utilisent maintenant `process.env.BACKEND_URL`
- URLs corrigées: `/api/sales/articles`, `/api/sales/clients`, `/api/sales/suppliers`

**Fichiers modifiés**:
- `frontend/app/api/sales/suppliers/route.ts`
- `frontend/app/api/sales/clients/route.ts`
- `frontend/app/api/sales/articles/route.ts`

### 2. Détection du type de base de données en production ✅

**Problème**:
Dans `payment-adapter.ts`, même si PostgreSQL était demandé, le code retournait toujours `'mysql'`:
```typescript
if (process.env.MYSQL_PROXY_URL) {
  return 'mysql'; // ❌ Toujours MySQL
}
```

**Solution**:
```typescript
if (process.env.MYSQL_PROXY_URL) {
  return explicitType; // ✅ Retourne le type demandé (mysql ou postgresql)
}
```

**Fichier modifié**:
- `frontend/lib/database/payment-adapter.ts`

### 3. Ajout de logs de débogage ✅

**Ajouté dans**:
- `frontend/app/api/payments/route.ts`: Logs des headers reçus
- `frontend/components/payments/PaymentForm.tsx`: Logs de la config localStorage

**Exemple de logs**:
```
🔍 PaymentForm - Submitting payment: { dbConfig: {...}, dbType: 'mysql', ... }
🔍 POST /api/payments - Headers: { 'X-Database-Type': 'mysql', ... }
💰 Creating payment: { ..., dbType: 'mysql' }
```

## Outils créés

### 1. test-localstorage.html ✅
Outil de diagnostic pour:
- Vérifier l'état du localStorage
- Configurer manuellement la base de données
- Tester l'envoi du header `X-Database-Type`

**Utilisation**:
```powershell
# Ouvrir dans le navigateur
start test-localstorage.html
```

### 2. GUIDE_DIAGNOSTIC_PAIEMENTS.md ✅
Guide complet pour diagnostiquer les problèmes de paiements:
- Procédure étape par étape
- Checklist de vérification
- Solutions aux problèmes courants
- Différences local vs production

### 3. CORRECTIONS_ROUTES_API.md ✅
Documentation technique des corrections:
- Avant/après pour chaque fichier
- Configuration Vercel requise
- Tests à effectuer

## Configuration Vercel

Variables d'environnement configurées:
```
BACKEND_URL=https://desktop-bhhs068.tail1d9c54.ts.net/api
MYSQL_PROXY_URL=https://desktop-bhhs068.tail1d9c54.ts.net/mysql
SUPABASE_URL=https://szgodrjglbpzkrksnroi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[clé]
```

## État des services

### Tailscale Funnel (actif)
- URL: `https://desktop-bhhs068.tail1d9c54.ts.net`
- `/api` → Backend (port 3005) ✅
- `/mysql` → Proxy MySQL (port 3308) ✅

### Bases de données
- **MySQL `2025_bu01`**: 4 articles, 5 clients, 3 fournisseurs
- **MySQL `stock_management`**: 7 paiements
- **Supabase**: 7 paiements
- **PostgreSQL**: 6 paiements

### Processus locaux
- Backend: port 3005 ✅
- Proxy MySQL: port 3308 ✅
- MySQL: port 3306 ✅
- Tailscale Funnel: actif ✅

## Prochaines étapes

### 1. Tester en production
1. Ouvrir l'application sur Vercel
2. Ouvrir la console du navigateur (F12)
3. Vérifier le localStorage:
   ```javascript
   localStorage.getItem('activeDbConfig')
   ```
4. Si nécessaire, configurer MySQL:
   ```javascript
   localStorage.setItem('activeDbConfig', JSON.stringify({
     type: 'mysql',
     name: 'MySQL via Tailscale',
     isActive: true,
     lastTested: new Date().toISOString()
   }));
   location.reload();
   ```

### 2. Vérifier les articles/clients/fournisseurs
1. Aller sur le dashboard
2. Vérifier que les compteurs affichent:
   - 4 articles
   - 5 clients
   - 3 fournisseurs
3. Si erreur 500/502, vérifier les logs Vercel

### 3. Tester la création de paiements
1. Sélectionner MySQL dans le sélecteur
2. Créer un bon de livraison
3. Enregistrer un paiement
4. Vérifier dans la console:
   - Logs client: `dbType: 'mysql'`
   - Logs serveur: `dbType: 'mysql'`
5. Vérifier dans MySQL:
   ```sql
   SELECT * FROM stock_management.payments ORDER BY id DESC LIMIT 1;
   ```

### 4. Diagnostic si problème persiste
1. Suivre le guide: `GUIDE_DIAGNOSTIC_PAIEMENTS.md`
2. Utiliser l'outil: `test-localstorage.html`
3. Vérifier les logs dans Vercel
4. Vérifier les deux bases de données

## Commits effectués

1. **bff8ffc**: Fix: Corriger routes API pour utiliser BACKEND_URL et chemins corrects
2. **56a9c35**: Add: Logs de débogage pour paiements + documentation corrections
3. **85cb05c**: Add: Guide diagnostic paiements + outil test localStorage

## Points importants à retenir

### localStorage et domaines
- Le localStorage est isolé par domaine
- `localhost:3000` ≠ `vercel.app`
- Il faut configurer la base de données séparément en local et en production

### Headers HTTP
- Le header `X-Database-Type` doit être envoyé par le client
- Valeur par défaut: `'supabase'` si absent
- Vérifier dans Network tab (F12)

### Proxy Tailscale
- Nécessaire pour accéder à MySQL depuis Vercel
- Doit être actif en permanence
- URL: `https://desktop-bhhs068.tail1d9c54.ts.net/mysql`

### Logs de débogage
- Côté client: Console du navigateur (F12)
- Côté serveur: Vercel Logs ou console locale
- Chercher les emojis: 🔍 📡 💰 ✅ ❌

## Commandes utiles

### Vérifier MySQL local
```powershell
mysql -u root -p -e "SELECT COUNT(*) FROM stock_management.payments;"
```

### Vérifier le proxy Tailscale
```powershell
curl https://desktop-bhhs068.tail1d9c54.ts.net/mysql/health
```

### Vérifier Vercel
```powershell
vercel logs --follow
```

### Redémarrer les services
```powershell
.\restart-all-services.ps1
```

## Fichiers de référence

- `CORRECTIONS_ROUTES_API.md`: Documentation technique des corrections
- `GUIDE_DIAGNOSTIC_PAIEMENTS.md`: Guide de diagnostic complet
- `test-localstorage.html`: Outil de test localStorage
- `TAILSCALE_CONFIGURATION_FINALE.md`: Configuration Tailscale
- `DEPLOIEMENT_TAILSCALE_COMPLET.md`: Guide de déploiement

## Résumé en une phrase

Correction des routes API pour utiliser les bonnes URLs et ajout d'outils de diagnostic pour résoudre le problème des paiements allant dans Supabase au lieu de MySQL.
