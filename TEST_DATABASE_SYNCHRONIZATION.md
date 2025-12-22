# 🧪 Test de Synchronisation des Bases de Données

## ✅ Statut: Prêt pour les Tests

Le système de synchronisation entre frontend et backend a été implémenté. Voici comment tester que les articles sont maintenant créés dans la bonne base de données.

---

## 🔧 Préparation des Tests

### 1. Vérifier que les Serveurs Fonctionnent

- **Frontend**: http://localhost:3000 ✅
- **Backend**: http://localhost:3005 ✅

### 2. Ouvrir la Page de Test

Ouvrir `test-database-indicator.html` dans un navigateur pour vérifier l'état des serveurs.

---

## 🧪 Tests à Effectuer

### Test 1: Vérification de l'Indicateur de Base de Données

1. **Aller au Dashboard**: http://localhost:3000/dashboard
2. **Vérifier l'Indicateur**: Dans le header, à côté du contexte tenant
3. **État Attendu**: 
   - ☁️ Supabase (Cloud PostgreSQL) - par défaut
   - Indicateur vert avec point de connexion

### Test 2: Création d'Article avec Supabase (Comportement par Défaut)

1. **Aller à**: http://localhost:3000/dashboard/add-article
2. **Créer un Article de Test**:
   - Code: `TEST_SUPABASE_001`
   - Désignation: `Test Article Supabase`
   - Famille: `Électricité`
   - Prix unitaire: `100`
   - Marge: `20`
   - TVA: `19`
   - Stock F: `10`
   - Stock BL: `5`
3. **Cliquer**: "Créer l'Article"
4. **Vérifier**: L'article doit être créé dans Supabase
5. **Retourner au Dashboard**: Vérifier que l'article apparaît dans la liste

### Test 3: Changement vers Base de Données Locale

1. **Aller à**: http://localhost:3000/admin/database-migration
2. **Configurer une Base Locale**:
   - Choisir MySQL ou PostgreSQL
   - Configurer les paramètres de connexion
   - Effectuer la migration
3. **Retourner au Dashboard**
4. **Vérifier l'Indicateur**: Doit maintenant afficher la base locale
   - 🐘 PostgreSQL (Local) ou 🐬 MySQL (Local)

### Test 4: Création d'Article avec Base de Données Locale

1. **Aller à**: http://localhost:3000/dashboard/add-article
2. **Créer un Article de Test**:
   - Code: `TEST_LOCAL_001`
   - Désignation: `Test Article Local`
   - Famille: `Plomberie`
   - Prix unitaire: `150`
   - Marge: `25`
   - TVA: `19`
   - Stock F: `8`
   - Stock BL: `3`
3. **Cliquer**: "Créer l'Article"
4. **Vérifier**: L'article doit être créé dans la base locale
5. **Retourner au Dashboard**: Vérifier que l'article apparaît dans la liste

### Test 5: Vérification de la Synchronisation Frontend/Backend

1. **Ouvrir la Console du Navigateur** (F12)
2. **Aller au Dashboard**
3. **Vérifier les Logs**:
   ```
   🔍 Database sync check: Frontend=mysql, Backend=mysql, Synced=true
   ✅ Database config synchronized with backend
   ```
4. **Si Non Synchronisé**: L'indicateur doit afficher un avertissement ⚠️

---

## 🔍 Points de Vérification

### Indicateur de Base de Données

- **Supabase**: ☁️ Vert avec "Cloud PostgreSQL"
- **PostgreSQL**: 🐘 Bleu avec "Local"
- **MySQL**: 🐬 Orange avec "Local"
- **Non Synchronisé**: ⚠️ Jaune avec "F:type ≠ B:type"

### Logs Backend (Console)

```bash
🔄 Backend received database switch request: mysql MySQL Local
✅ Backend database switched to: mysql
🆕 Creating article in 2025_bu01 (DB: mysql): TEST_LOCAL_001
✅ Article created in mysql: [object Object]
```

### Logs Frontend (Console Navigateur)

```javascript
🔄 Synchronizing database config with backend: mysql MySQL Local
✅ Backend database config synchronized: Backend switched to mysql (MySQL Local)
🔍 Database sync check: Frontend=mysql, Backend=mysql, Synced=true
```

---

## 🚨 Problèmes Possibles et Solutions

### Problème 1: Indicateur Affiche "Non Synchronisé"

**Symptômes**: ⚠️ avec "F:supabase ≠ B:mysql"

**Solution**:
1. Ouvrir la console du navigateur
2. Exécuter: `localStorage.clear()`
3. Recharger la page
4. Reconfigurer la base de données

### Problème 2: Articles Créés dans la Mauvaise Base

**Symptômes**: Article créé dans Supabase alors que l'indicateur montre MySQL

**Solution**:
1. Vérifier les logs backend pour voir le type de base utilisé
2. Redémarrer le backend: `Ctrl+C` puis `bun run index.ts`
3. Forcer la synchronisation via la console:
   ```javascript
   // Dans la console du navigateur
   fetch('/api/database-type').then(r => r.json()).then(console.log)
   ```

### Problème 3: Erreur de Connexion à la Base Locale

**Symptômes**: Erreur 500 lors de la création d'article

**Solution**:
1. Vérifier que MySQL/PostgreSQL est démarré
2. Vérifier les paramètres de connexion
3. Tester la connexion via la page de migration

---

## 📊 Résultats Attendus

### Avant la Correction (Problème Original)

- ❌ Indicateur: ☁️ Supabase
- ❌ Article créé dans: Supabase (même si indicateur montre local)
- ❌ Synchronisation: Frontend ≠ Backend

### Après la Correction (Comportement Souhaité)

- ✅ Indicateur: 🐬 MySQL (ou 🐘 PostgreSQL)
- ✅ Article créé dans: Base de données locale correspondante
- ✅ Synchronisation: Frontend = Backend
- ✅ Logs: Confirmation de création dans la bonne base

---

## 🎯 Commandes de Test Rapide

### Test API Backend

```bash
# Vérifier le type de base de données backend
curl http://localhost:3005/api/database-config

# Changer la base de données backend
curl -X POST http://localhost:3005/api/database-config \
  -H "Content-Type: application/json" \
  -d '{"type":"mysql","name":"MySQL Local","host":"localhost","port":3306,"database":"stock_local","username":"root","password":""}'
```

### Test API Frontend

```bash
# Vérifier le type de base de données frontend
curl http://localhost:3000/api/database-type
```

### Test dans la Console du Navigateur

```javascript
// Vérifier la synchronisation
fetch('/api/database-type').then(r => r.json()).then(data => {
  console.log('Frontend DB:', data.data.type);
});

fetch('http://localhost:3005/api/database-config').then(r => r.json()).then(data => {
  console.log('Backend DB:', data.data.type);
});

// Forcer la synchronisation
localStorage.setItem('activeDbConfig', JSON.stringify({
  type: 'mysql',
  name: 'MySQL Local',
  host: 'localhost',
  port: 3306,
  database: 'stock_local',
  username: 'root',
  password: '',
  isActive: true
}));
```

---

## ✅ Critères de Réussite

1. **Indicateur Correct**: Affiche le bon type de base de données
2. **Synchronisation**: Frontend et Backend utilisent la même base
3. **Création d'Articles**: Articles créés dans la base indiquée par l'indicateur
4. **Logs Cohérents**: Logs confirment l'utilisation de la bonne base
5. **Pas d'Avertissements**: Aucun indicateur ⚠️ de non-synchronisation

---

**Date de Test**: 22 décembre 2025  
**Version**: 2.0.0 (avec synchronisation)  
**Statut**: 🧪 Prêt pour les Tests