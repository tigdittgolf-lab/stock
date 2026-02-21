# ✅ Checklist - Fix Migration exec_sql

## Préparation

- [ ] Serveur Next.js en cours d'exécution sur port 3001
- [ ] Accès à Supabase SQL Editor
- [ ] Fichier `CREATE_DISCOVERY_RPC_FUNCTIONS.sql` disponible

---

## Étape 1: Exécuter le SQL dans Supabase

### 1.1 Ouvrir l'Éditeur SQL
- [ ] Aller sur: https://szgodrjglbpzkrksnroi.supabase.co/project/_/sql
- [ ] Se connecter si nécessaire

### 1.2 Copier le Fichier SQL
- [ ] Ouvrir `CREATE_DISCOVERY_RPC_FUNCTIONS.sql`
- [ ] Sélectionner tout le contenu (Ctrl+A)
- [ ] Copier (Ctrl+C)

### 1.3 Exécuter dans Supabase
- [ ] Coller dans l'éditeur SQL Supabase
- [ ] Cliquer sur "Run" ou appuyer sur Ctrl+Enter
- [ ] Attendre le message de succès (quelques secondes)

### 1.4 Vérifier les Fonctions Créées
- [ ] Exécuter cette requête:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'exec_sql',
  'discover_tenant_schemas',
  'discover_schema_tables',
  'discover_table_structure',
  'get_all_table_data',
  'create_schema_if_not_exists'
)
ORDER BY routine_name;
```
- [ ] Vérifier que 6 fonctions sont listées

---

## Étape 2: Tester la Fonction exec_sql

### 2.1 Test Simple
- [ ] Exécuter dans l'éditeur SQL:
```sql
SELECT exec_sql('SELECT 1');
```
- [ ] Vérifier le résultat: `{"success": true}`

### 2.2 Test Création Schéma
- [ ] Exécuter:
```sql
SELECT exec_sql('CREATE SCHEMA IF NOT EXISTS test_migration');
```
- [ ] Vérifier le résultat: `{"success": true}`

### 2.3 Test Création Table
- [ ] Exécuter:
```sql
SELECT exec_sql('CREATE TABLE IF NOT EXISTS test_migration.test_table (id INT, name TEXT)');
```
- [ ] Vérifier le résultat: `{"success": true}`

### 2.4 Vérifier la Table
- [ ] Exécuter:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'test_migration' AND table_name = 'test_table';
```
- [ ] Vérifier qu'une ligne est retournée

### 2.5 Nettoyage
- [ ] Exécuter:
```sql
SELECT exec_sql('DROP SCHEMA IF EXISTS test_migration CASCADE');
```
- [ ] Vérifier le résultat: `{"success": true}`

---

## Étape 3: Tester les Connexions

### 3.1 Ouvrir l'Interface de Migration
- [ ] Aller sur: http://localhost:3001/admin/database-migration
- [ ] Vérifier que la page se charge

### 3.2 Tester MySQL
- [ ] Cliquer sur "Tester les connexions"
- [ ] Vérifier: "✅ Connexion MySQL établie"

### 3.3 Tester Supabase
- [ ] Vérifier: "✅ Connexion Supabase établie"
- [ ] Si erreur DNS, vérifier `.env.local`:
  - `NODE_OPTIONS=--dns-result-order=ipv4first`
  - `NODE_TLS_REJECT_UNAUTHORIZED=0`

---

## Étape 4: Découvrir les Bases MySQL

### 4.1 Découverte Automatique
- [ ] Cliquer sur "Découvrir les bases MySQL"
- [ ] Attendre quelques secondes

### 4.2 Vérifier les Bases Découvertes
- [ ] Vérifier que `2009_bu02` apparaît dans la liste
- [ ] Vérifier que d'autres bases tenant apparaissent (2010_bu01, etc.)

### 4.3 Sélectionner 2009_bu02
- [ ] Cocher uniquement `2009_bu02`
- [ ] Laisser les autres décochées pour ce test

---

## Étape 5: Lancer la Migration

### 5.1 Configuration
- [ ] Vérifier que "Inclure le schéma" est coché
- [ ] Vérifier que "Inclure les données" est coché
- [ ] Vérifier que "Écraser si existe" est coché

### 5.2 Démarrer
- [ ] Cliquer sur "Démarrer la migration"
- [ ] Observer la progression en temps réel

### 5.3 Suivre la Progression
- [ ] Étape 1/9: Découverte ✅
  - Devrait trouver 33 tables dans 2009_bu02
- [ ] Étape 2/9: Validation ✅
- [ ] Étape 3/9: Nettoyage ✅
- [ ] Étape 4/9: Schémas ✅
  - Création du schéma 2009_bu02
- [ ] Étape 5/9: Tables ✅ ← CRITIQUE (FIX ICI)
  - Création des 33 tables
  - Vérifier qu'aucune erreur "exec_sql not found"
- [ ] Étape 6/9: Données ✅
  - Migration des données
- [ ] Étape 7/9: Fonctions RPC ✅
- [ ] Étape 8/9: Vérification ✅
- [ ] Étape 9/9: Terminé ✅

---

## Étape 6: Vérifier le Résultat

### 6.1 Vérifier le Schéma dans Supabase
- [ ] Aller dans l'éditeur SQL Supabase
- [ ] Exécuter:
```sql
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = '2009_bu02';
```
- [ ] Vérifier qu'une ligne est retournée

### 6.2 Vérifier les Tables
- [ ] Exécuter:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = '2009_bu02'
ORDER BY table_name;
```
- [ ] Vérifier que 33 tables sont listées

### 6.3 Vérifier les Données
- [ ] Exécuter quelques requêtes:
```sql
SELECT COUNT(*) FROM "2009_bu02".article;
SELECT COUNT(*) FROM "2009_bu02".client;
SELECT COUNT(*) FROM "2009_bu02".fournisseur;
```
- [ ] Vérifier que les counts sont > 0

### 6.4 Comparer avec MySQL
- [ ] Ouvrir MySQL Workbench ou ligne de commande
- [ ] Exécuter les mêmes requêtes dans MySQL:
```sql
USE 2009_bu02;
SELECT COUNT(*) FROM article;
SELECT COUNT(*) FROM client;
SELECT COUNT(*) FROM fournisseur;
```
- [ ] Comparer les counts (devraient être identiques)

---

## Étape 7: Tests Supplémentaires (Optionnel)

### 7.1 Tester une Autre Base
- [ ] Retourner sur l'interface de migration
- [ ] Sélectionner `2010_bu01` (ou une autre base)
- [ ] Lancer la migration
- [ ] Vérifier le succès

### 7.2 Migration Multiple
- [ ] Sélectionner plusieurs bases (2-3)
- [ ] Lancer la migration
- [ ] Vérifier que toutes réussissent

---

## Diagnostic en Cas d'Échec

### Si exec_sql n'existe toujours pas
- [ ] Vérifier dans Supabase:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'exec_sql';
```
- [ ] Si vide: Réexécuter `CREATE_DISCOVERY_RPC_FUNCTIONS.sql`

### Si les tables ne sont pas créées
- [ ] Vérifier les logs du serveur Next.js (terminal)
- [ ] Vérifier la console du navigateur (F12)
- [ ] Chercher les messages d'erreur détaillés
- [ ] Vérifier que le SQL généré est correct

### Si les données ne sont pas migrées
- [ ] Vérifier que les tables existent
- [ ] Vérifier les logs d'insertion
- [ ] Vérifier les contraintes de clés primaires
- [ ] Vérifier les types de données

### Si erreur de connexion
- [ ] Vérifier `.env.local`
- [ ] Vérifier que le serveur est sur port 3001
- [ ] Vérifier les credentials MySQL
- [ ] Vérifier les credentials Supabase

---

## Documentation de Référence

- [ ] `QUICK_FIX_GUIDE.md` - Guide rapide
- [ ] `FIX_EXEC_SQL_FUNCTION.md` - Guide détaillé
- [ ] `MIGRATION_FIX_COMPLETE.md` - Documentation complète
- [ ] `ARCHITECTURE_FIX_DIAGRAM.md` - Diagrammes
- [ ] `test-exec-sql-function.sql` - Tests SQL
- [ ] `STATUS_UPDATE_EXEC_SQL_FIX.md` - Status update

---

## Résultat Final Attendu

### Succès Complet ✅
- [x] 6 fonctions RPC créées dans Supabase
- [x] Fonction exec_sql testée et fonctionnelle
- [x] Connexions MySQL et Supabase OK
- [x] 33 tables découvertes dans 2009_bu02
- [x] Schéma 2009_bu02 créé dans Supabase
- [x] 33 tables créées dans Supabase
- [x] Toutes les données migrées
- [x] Vérification: counts identiques MySQL vs Supabase

### Temps Total Estimé
- Exécution SQL: 2 minutes
- Tests: 3 minutes
- Migration: 5-10 minutes (selon volume de données)
- Vérification: 2 minutes

**Total: 12-17 minutes** ⏱️

---

## Notes Importantes

⚠️ **Développement uniquement**
- `NODE_TLS_REJECT_UNAUTHORIZED=0` est pour le développement
- Ne JAMAIS utiliser en production

⚠️ **Backup**
- Toujours avoir un backup avant migration
- Tester sur une base de test d'abord

⚠️ **Performance**
- La migration peut prendre du temps selon le volume
- Ne pas fermer le navigateur pendant la migration
- Observer les logs pour suivre la progression

✅ **Succès**
- Si toutes les étapes passent, la migration est réussie
- Le système est maintenant opérationnel
- Vous pouvez migrer d'autres bases tenant

---

**Date**: Session actuelle  
**Version**: 1.0  
**Statut**: ✅ Prêt pour exécution
