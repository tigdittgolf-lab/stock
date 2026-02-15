# Instructions pour redémarrer et tester

## Problème identifié
Tu as 439 BL dans la table `bachat` mais l'API retourne 0 résultats.

## Cause
Le backend tourne avec l'ancien code. Les modifications du `databaseRouter.ts` ne sont pas encore actives.

## Solution

### 1. Redémarrer le backend

Ouvre un terminal dans le dossier `backend` et exécute:

```bash
cd backend
npm run dev
```

Ou si tu utilises un autre script:
```bash
npm start
```

### 2. Vérifier que le backend démarre correctement

Tu devrais voir dans les logs:
```
🚀 Backend server running on port 3005
📊 Configuration par défaut: MySQL Local
```

### 3. Tester l'API

Une fois le backend redémarré, exécute:
```bash
node test-purchases-api.js
```

Tu devrais maintenant voir:
```
✅ Succès!
Nombre de BL: 439
Source: database
Database: mysql
```

### 4. Vérifier dans le navigateur

1. Ouvre http://localhost:3000/purchases/delivery-notes/list
2. Tu devrais voir tes 439 BL d'achat
3. Les données doivent venir de ta vraie base MySQL

## Modifications apportées

### backend/src/services/databaseRouter.ts
- Corrigé la méthode `.from()` pour qu'elle exécute correctement les requêtes SQL
- Ajouté des logs pour déboguer (`🔍 DatabaseRouter query:`)
- Gestion correcte des valeurs NULL et des chaînes avec apostrophes

### backend/src/routes/purchases.ts
- GET `/api/purchases/delivery-notes` récupère directement depuis `bachat`
- GET `/api/purchases/delivery-notes/:id` récupère depuis `bachat` et `bachat_detail`
- Enrichissement avec les données fournisseur et article

## Vérification des logs

Quand tu charges la page, tu devrais voir dans les logs du backend:
```
📋 Fetching purchase delivery notes for tenant: 2009_bu02
🔍 DatabaseRouter query: SELECT * FROM bachat ORDER BY date_fact DESC
🐬 MySQL: Executing query: SELECT * FROM bachat ORDER BY date_fact DESC...
✅ MySQL: Query successful, 439 rows returned
✅ Returning 439 purchase delivery notes
```

## Si ça ne fonctionne toujours pas

1. **Vérifier la base de données active:**
   - Le frontend utilise le tenant `2009_bu02`
   - Vérifie que c'est bien la bonne base

2. **Vérifier les données:**
   ```sql
   SELECT * FROM bachat LIMIT 3;
   ```

3. **Vérifier les logs backend:**
   - Cherche les messages d'erreur
   - Vérifie que la requête SQL est correcte

4. **Tester directement l'API:**
   ```bash
   curl -H "X-Tenant: 2009_bu02" http://localhost:3005/api/purchases/delivery-notes
   ```

## Contact

Si le problème persiste après le redémarrage, partage:
1. Les logs du backend au démarrage
2. Les logs quand tu charges la page
3. Le résultat de `SELECT * FROM bachat LIMIT 1;`
