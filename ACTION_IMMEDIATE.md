# 🚀 Actions Immédiates - À faire maintenant

## ✅ Ce qui a été corrigé

1. **Routes API** → Utilisent maintenant `process.env.BACKEND_URL` avec les bons chemins
2. **Détection base de données** → Retourne le bon type (mysql/postgresql) en production
3. **Logs de débogage** → Ajoutés pour diagnostiquer les problèmes

## 🎯 Ce que vous devez faire MAINTENANT

### 1. Tester en production (Vercel)

#### Étape 1: Ouvrir l'application
```
https://frontend-7gr8oq0oz-habibbelkacemimosta-7724s-projects.vercel.app
```

#### Étape 2: Ouvrir la console (F12)
- Appuyer sur F12
- Aller dans l'onglet "Console"

#### Étape 3: Vérifier le localStorage
Taper dans la console:
```javascript
localStorage.getItem('activeDbConfig')
```

**Si le résultat est `null` ou contient `"type":"supabase"`**, taper:
```javascript
localStorage.setItem('activeDbConfig', JSON.stringify({
  type: 'mysql',
  name: 'MySQL via Tailscale',
  isActive: true,
  lastTested: new Date().toISOString()
}));
location.reload();
```

#### Étape 4: Vérifier les données
Après rechargement, vous devriez voir:
- ✅ 4 articles
- ✅ 5 clients
- ✅ 3 fournisseurs

**Si vous voyez 0 partout** → Vérifier les logs dans la console

### 2. Tester la création de paiements

#### Étape 1: Créer un bon de livraison
1. Aller dans "Ventes" → "Bons de livraison"
2. Créer un nouveau BL
3. Ouvrir le BL créé

#### Étape 2: Enregistrer un paiement
1. Cliquer sur "💰 Enregistrer un paiement"
2. Remplir le formulaire
3. **AVANT de cliquer sur "Enregistrer"**, regarder la console (F12)
4. Cliquer sur "Enregistrer"

#### Étape 3: Vérifier les logs
Dans la console, vous devriez voir:
```
🔍 PaymentForm - Submitting payment: { dbConfig: {...}, dbType: 'mysql', ... }
📡 PaymentForm - Response: { status: 201, data: {...} }
```

**Si `dbType` vaut `'supabase'`** → Le localStorage n'est pas configuré (retour à l'étape 1)

#### Étape 4: Vérifier dans MySQL
```powershell
mysql -u root -p -e "SELECT * FROM stock_management.payments ORDER BY id DESC LIMIT 1;"
```

Le paiement doit apparaître ici, PAS dans Supabase.

### 3. Si ça ne fonctionne toujours pas

#### Option A: Utiliser l'outil de test
```powershell
start test-localstorage.html
```
1. Cliquer sur "🐬 Configurer MySQL"
2. Retourner sur l'application
3. Réessayer

#### Option B: Suivre le guide complet
```
Ouvrir: GUIDE_DIAGNOSTIC_PAIEMENTS.md
```

## 📊 Vérifications rapides

### Vérifier que Tailscale fonctionne
```powershell
curl https://desktop-bhhs068.tail1d9c54.ts.net/mysql/health
```
**Résultat attendu**: `{"status":"ok",...}`

### Vérifier que le backend répond
```powershell
curl https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/articles -H "X-Tenant: 2025_bu01"
```
**Résultat attendu**: JSON avec 4 articles

### Vérifier MySQL local
```powershell
mysql -u root -p -e "SELECT COUNT(*) as total FROM stock_management.payments;"
```
**Résultat attendu**: 7 paiements (ou plus si vous en avez créé)

## 🆘 En cas de problème

### Problème: Erreur 500/502 pour articles/clients
**Solution**: Vérifier que le backend est accessible
```powershell
curl https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/articles -H "X-Tenant: 2025_bu01"
```

### Problème: Paiements vont dans Supabase
**Solution**: Vérifier le localStorage (voir étape 1 ci-dessus)

### Problème: 0 articles/clients/fournisseurs
**Solution**: 
1. Vérifier que vous êtes sur le bon tenant (2025_bu01)
2. Vérifier que le backend répond
3. Regarder les logs dans la console (F12)

## 📝 Logs à surveiller

### Dans la console du navigateur (F12)
```
🔍 PaymentForm - Submitting payment: { dbType: 'mysql', ... }
📡 PaymentForm - Response: { status: 201, ... }
```

### Dans Vercel Logs
```
🔍 POST /api/payments - Headers: { 'X-Database-Type': 'mysql', ... }
💰 Creating payment: { dbType: 'mysql', ... }
✅ Payment created: 123
```

## 🎉 Succès confirmé quand

- [ ] Articles/clients/fournisseurs s'affichent en production
- [ ] Le sélecteur MySQL est actif (bordure orange)
- [ ] Les logs affichent `dbType: 'mysql'`
- [ ] Les paiements apparaissent dans MySQL
- [ ] Les paiements n'apparaissent PAS dans Supabase

## 📚 Documentation complète

- `RESUME_SESSION_10_FEV_2026.md` → Résumé complet de la session
- `CORRECTIONS_ROUTES_API.md` → Détails techniques des corrections
- `GUIDE_DIAGNOSTIC_PAIEMENTS.md` → Guide de diagnostic complet
- `test-localstorage.html` → Outil de test localStorage

---

**Note importante**: Le localStorage est différent entre localhost et vercel.app. Il faut configurer MySQL séparément sur chaque domaine!
