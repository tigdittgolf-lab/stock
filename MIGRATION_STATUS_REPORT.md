# 📊 RAPPORT D'ÉTAT DE LA MIGRATION MYSQL → SUPABASE

**Date**: 19 février 2026  
**Statut**: ❌ **MIGRATION NON À JOUR - DONNÉES MANQUANTES**

---

## 🔍 RÉSUMÉ DE LA SITUATION

### État actuel:
- ✅ **MySQL Local**: Contient des données (article: 1, client: 1, fournisseur: 1, detail_bl: 8)
- ❌ **Supabase Cloud**: Tables métier VIDES (0 enregistrements)
- ⚠️  **Migration**: N'a jamais été complétée avec succès

### Pourquoi la migration échoue:
La migration utilise des **fonctions RPC PostgreSQL** pour découvrir les tables et données:
- `discover_tenant_schemas()` - Découvre les schémas (2025_bu01, 2025_bu02, etc.)
- `discover_schema_tables(p_schema_name)` - Liste les tables d'un schéma
- `discover_table_structure(p_schema_name, p_table_name)` - Analyse la structure d'une table

**PROBLÈME**: Ces fonctions RPC n'existent PAS dans Supabase actuellement.

---

## 📋 DONNÉES ACTUELLES

### MySQL Local (2025_bu01):
```
✅ article: 1 enregistrement
✅ client: 1 enregistrement  
✅ fournisseur: 1 enregistrement
✅ detail_bl: 8 enregistrements
❌ bl_vente: Table n'existe pas
❌ facture: Table n'existe pas
❌ detail_facture: Table n'existe pas
❌ proforma: Table n'existe pas
❌ detail_proforma: Table n'existe pas
❌ famille: Table n'existe pas
❌ users: Table n'existe pas (existe dans Supabase)
```

### Supabase Cloud:
```
⚪ article: 0 enregistrements (VIDE)
⚪ client: 0 enregistrements (VIDE)
⚪ fournisseur: 0 enregistrements (VIDE)
⚪ bl_vente: 0 enregistrements (VIDE)
⚪ facture: 0 enregistrements (VIDE)
✅ users: 6 enregistrements (admin, manager, user)
```

---

## 🔧 SOLUTION POUR FAIRE FONCTIONNER LA MIGRATION

### Option 1: Créer les fonctions RPC dans Supabase (RECOMMANDÉ)

Les fonctions RPC doivent être créées dans Supabase via le SQL Editor:

1. **Aller sur**: https://szgodrjglbpzkrksnroi.supabase.co/project/_/sql
2. **Exécuter les scripts SQL** pour créer les 3 fonctions RPC
3. **Relancer la migration** via l'interface web

Les scripts SQL sont disponibles dans:
- `frontend/lib/database/rpc-functions/` (si le dossier existe)
- Ou doivent être créés

### Option 2: Migration manuelle simple (RAPIDE)

Créer un script Node.js qui:
1. Lit les données de MySQL directement
2. Les insère dans Supabase via l'API REST
3. Sans utiliser les fonctions RPC

---

## 🎯 RECOMMANDATION

**Pour tester rapidement sur smartphone**:

1. **Utiliser Option 2** (migration manuelle) car c'est plus rapide
2. Créer un script `simple-mysql-to-supabase-migration.js`
3. Migrer uniquement les tables essentielles:
   - `article` (1 enregistrement)
   - `client` (1 enregistrement)
   - `fournisseur` (1 enregistrement)
   - `detail_bl` (8 enregistrements)

4. **Tester sur smartphone** via Tailscale ou directement Supabase

---

## 📱 ACCÈS SMARTPHONE

### Via Supabase (FONCTIONNE):
- ✅ Pas besoin de Tailscale
- ✅ Accessible de n'importe où
- ✅ URL: https://szgodrjglbpzkrksnroi.supabase.co
- ❌ Mais données manquantes actuellement

### Via MySQL Local (NE FONCTIONNE PAS):
- ❌ MySQL écoute sur localhost uniquement
- ❌ Tailscale permet d'accéder au serveur Next.js mais pas à MySQL
- ❌ Next.js se connecte à localhost:3306 qui n'est valide que sur le PC

---

## 🚀 PROCHAINES ÉTAPES

1. **Décider**: Option 1 (RPC) ou Option 2 (migration simple)?
2. **Exécuter** la migration choisie
3. **Vérifier** que les données sont dans Supabase
4. **Tester** sur smartphone

---

## 💡 NOTES IMPORTANTES

- La migration via l'interface web (`http://localhost:3000/admin/database-migration`) ne fonctionnera PAS tant que les fonctions RPC ne sont pas créées dans Supabase
- L'erreur HTTP 400 que tu as eue est due à l'absence de ces fonctions RPC
- Une fois les données migrées, le dashboard fonctionnera sur smartphone via Supabase
