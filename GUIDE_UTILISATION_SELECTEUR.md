# 🎯 Guide d'utilisation du sélecteur de base de données

## ✅ DÉPLOIEMENT TERMINÉ

**URL de production** : https://frontend-fmmokvp8g-habibbelkacemimosta-7724s-projects.vercel.app

## 🎨 NOUVEAU : Sélecteur de base de données

Un sélecteur a été ajouté dans le dashboard pour changer facilement de base de données.

## 📍 OÙ LE TROUVER ?

### En local
```
http://localhost:3000/dashboard
```

### En production
```
https://frontend-fmmokvp8g-habibbelkacemimosta-7724s-projects.vercel.app/dashboard
```

**Position** : En haut à droite du dashboard, vous verrez :

```
Base de données: [☁️ Supabase (Cloud)] [🐬 MySQL (Local)] [🐘 PostgreSQL (Local)]
```

## 🔄 COMMENT CHANGER DE BASE DE DONNÉES

### Étape 1 : Cliquez sur un bouton

- **☁️ Supabase (Cloud)** : Données dans le cloud
- **🐬 MySQL (Local)** : Données sur votre PC (port 3306)
- **🐘 PostgreSQL (Local)** : Données sur votre PC (port 5432)

### Étape 2 : La page se recharge automatiquement

Le sélecteur :
1. Sauvegarde votre choix dans `localStorage`
2. Recharge la page
3. Toutes les requêtes utilisent maintenant la base sélectionnée

### Étape 3 : Vérifiez l'indicateur

À côté du sélecteur, vous verrez l'indicateur qui confirme la base active :
- ☁️ Supabase (vert)
- 🐬 MySQL (orange)
- 🐘 PostgreSQL (bleu)

## 📊 ÉTAT ACTUEL DES DONNÉES

| Base | Localisation | Paiements | Accessible |
|------|--------------|-----------|------------|
| Supabase | Cloud | 7 | ✅ Partout |
| MySQL | Local (3306) | 7 | ✅ Local + Tailscale |
| PostgreSQL | Local (5432) | 6 | ✅ Local uniquement |

## 🧪 TESTER LE SÉLECTEUR

### Test 1 : Supabase (Cloud)

1. Cliquez sur **☁️ Supabase (Cloud)**
2. Allez sur le BL 3
3. Vous devriez voir :
   - Solde : 8000 DA restant
   - 2 paiements (4000 DA + 65.17 DA)

### Test 2 : MySQL (Local)

1. Cliquez sur **🐬 MySQL (Local)**
2. Allez sur le BL 3
3. Vous devriez voir :
   - Solde : 8000 DA restant
   - 2 paiements (4000 DA + 65.17 DA)

### Test 3 : Créer un paiement

1. Sélectionnez **🐬 MySQL (Local)**
2. Allez sur le BL 3
3. Cliquez sur "💰 Enregistrer un paiement"
4. Ajoutez 500 DA
5. Vérifiez que le paiement apparaît
6. Changez vers **☁️ Supabase**
7. Le paiement de 500 DA ne devrait PAS être là (bases séparées)

## ⚠️ IMPORTANT À COMPRENDRE

### Les bases sont INDÉPENDANTES

- **Supabase** : Données dans le cloud (accessibles partout)
- **MySQL** : Données sur votre PC (accessibles en local + via Tailscale)
- **PostgreSQL** : Données sur votre PC (accessibles en local uniquement)

### Créer un paiement

Quand vous créez un paiement :
- Il va UNIQUEMENT dans la base sélectionnée
- Il n'apparaît PAS dans les autres bases
- C'est normal et voulu

### En production (Vercel)

**Avec Tailscale configuré** :
- ☁️ Supabase : ✅ Fonctionne
- 🐬 MySQL : ✅ Fonctionne (via Tailscale proxy)
- 🐘 PostgreSQL : ❌ Non disponible (pas de proxy configuré)

**Sans Tailscale** :
- ☁️ Supabase : ✅ Fonctionne
- 🐬 MySQL : ❌ Force Supabase automatiquement
- 🐘 PostgreSQL : ❌ Force Supabase automatiquement

## 🔍 VÉRIFIER QUELLE BASE EST ACTIVE

### Méthode 1 : Regarder l'indicateur
L'indicateur à côté du sélecteur montre la base active.

### Méthode 2 : Console du navigateur
Ouvrez la console (F12) et tapez :
```javascript
JSON.parse(localStorage.getItem('activeDbConfig'))
```

### Méthode 3 : Créer un paiement de test
Créez un paiement avec une note unique (ex: "TEST MYSQL"), puis vérifiez dans quelle base il apparaît.

## 🐛 DÉPANNAGE

### Le sélecteur ne s'affiche pas
- Videz le cache : Ctrl+Shift+R
- Vérifiez que vous êtes sur `/dashboard`

### Les données ne changent pas
- Vérifiez l'indicateur (doit correspondre au bouton cliqué)
- Rechargez la page manuellement (F5)
- Vérifiez la console pour les erreurs

### "Erreur lors du chargement du solde"
- En local : Vérifiez que MySQL/PostgreSQL tourne
- En production : Utilisez Supabase ou vérifiez Tailscale

### Les paiements sont vides
- Vérifiez que vous avez des données dans cette base
- Utilisez les scripts de test pour vérifier :
  ```powershell
  # MySQL
  $body = '{"sql":"SELECT COUNT(*) FROM payments"}'
  Invoke-WebRequest -Uri "http://localhost:3308/api/mysql/query" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
  ```

## 📝 COMMANDES UTILES

### Vérifier MySQL local
```powershell
$body = '{"sql":"SELECT * FROM payments ORDER BY id DESC LIMIT 3"}'
Invoke-WebRequest -Uri "http://localhost:3308/api/mysql/query" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
```

### Vérifier Supabase
```powershell
node -e "const { createClient } = require('@supabase/supabase-js'); const supabase = createClient('https://szgodrjglbpzkrksnroi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU'); supabase.from('payments').select('*').limit(3).order('id', {ascending: false}).then(r => console.log(r.data));"
```

### Réinitialiser la configuration
```javascript
// Dans la console du navigateur (F12)
localStorage.removeItem('activeDbConfig');
location.reload();
```

## 🎉 RÉSUMÉ

**Ce qui a été ajouté** :
- ✅ Sélecteur visuel avec 3 boutons
- ✅ Changement instantané de base de données
- ✅ Sauvegarde automatique du choix
- ✅ Rechargement automatique de la page

**Comment l'utiliser** :
1. Allez sur le dashboard
2. Cliquez sur le bouton de votre choix
3. La page se recharge
4. Toutes les données viennent maintenant de cette base

**Prêt à tester !** 🚀
