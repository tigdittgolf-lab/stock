# 🎯 MIGRATION FINALE - INSTRUCTIONS

## Situation actuelle

- ❌ **Migration NON à jour** - Supabase est presque vide
- ✅ **MySQL** contient les données (article: 1, client: 1, fournisseur: 1, detail_bl: 8)
- ⚠️ **Supabase** ne contient que fournisseur (1 enregistrement)

## Pourquoi les méthodes précédentes ont échoué?

1. **Interface web** (`/admin/database-migration`) - Nécessite des fonctions RPC qui n'existent pas
2. **API REST Supabase** - Ne supporte pas les schémas personnalisés (2025_bu01)
3. **Fonctions RPC** - Problèmes de mapping des colonnes et types de données

## ✅ SOLUTION FINALE: Connexion PostgreSQL directe

Le script `final-migration-pg.js` se connecte DIRECTEMENT à PostgreSQL de Supabase (pas via l'API REST).

### Étape 1: Récupérer le mot de passe PostgreSQL

1. Aller sur: https://szgodrjglbpzkrksnroi.supabase.co/project/_/settings/database
2. Chercher la section "Connection string" ou "Database password"
3. Copier le mot de passe (ou le réinitialiser si oublié)

### Étape 2: Configurer le script

Ouvrir `final-migration-pg.js` et modifier la ligne:

```javascript
password: 'Habib@2024', // ⚠️ REMPLACER PAR TON MOT DE PASSE
```

### Étape 3: Lancer la migration

```bash
node final-migration-pg.js
```

### Étape 4: Vérifier

```bash
node verify-tenant-data.js
```

## 📊 Résultat attendu

```
✅ article: 1 enregistrement
✅ client: 1 enregistrement  
✅ fournisseur: 1 enregistrement
⚪ detail_bl: 0 (nécessite bl_vente qui n'existe pas dans MySQL)
```

## 🚀 Après la migration

Une fois les données migrées, tu pourras:

1. **Tester sur PC via Tailscale**:
   - http://100.85.136.96:3000/dashboard

2. **Tester sur smartphone**:
   - Via Tailscale: http://100.85.136.96:3000/dashboard
   - Ou déployer sur Vercel pour accès direct

## ⚠️ Note sur detail_bl

La table `detail_bl` a une contrainte de clé étrangère vers `bl_vente` (nfact).
Mais `bl_vente` n'existe PAS dans MySQL 2025_bu01.

Options:
1. Ignorer `detail_bl` pour l'instant
2. Créer des enregistrements factices dans `bl_vente`
3. Supprimer la contrainte de clé étrangère dans Supabase

## 🔧 Dépannage

### Erreur: "password authentication failed"
- Vérifier le mot de passe PostgreSQL dans Supabase
- Le réinitialiser si nécessaire

### Erreur: "connection refused"
- Vérifier la connexion Internet
- Vérifier que l'URL de connexion est correcte

### Erreur: "relation does not exist"
- Vérifier que les tables existent dans le schéma 2025_bu01
- Vérifier que le schéma existe dans Supabase

## 📝 Fichiers créés

- `final-migration-pg.js` - Script de migration final
- `verify-tenant-data.js` - Vérification des données
- `CREATE_SUPABASE_MIGRATION_FUNCTIONS.sql` - Fonctions RPC (déjà exécuté)
- `MIGRATION_STATUS_REPORT.md` - Rapport détaillé
- Ce fichier - Instructions

## 💡 Prochaine étape

**Donne-moi le mot de passe PostgreSQL de Supabase** et je lancerai la migration finale.

Ou si tu préfères le faire toi-même:
1. Modifier `final-migration-pg.js` avec ton mot de passe
2. Lancer `node final-migration-pg.js`
3. Vérifier avec `node verify-tenant-data.js`
