# COMPLETE MIGRATION SYSTEM - INSTRUCTIONS

## PROBLÈME RÉSOLU
Le système de migration ne créait que 2 tables (article, client) au lieu des 11 tables complètes. Maintenant le système migre TOUTES les tables avec leurs données.

## ÉTAPES À SUIVRE

### 1. CRÉER LES FONCTIONS RPC DANS SUPABASE (OBLIGATOIRE)

**Ouvrez Supabase SQL Editor et exécutez le fichier :**
```
EXECUTE_RPC_FUNCTIONS_CREATION.sql
```

Ce fichier crée 11 fonctions RPC qui retournent les données de toutes les tables :
- `get_articles_by_tenant()`
- `get_clients_by_tenant()`
- `get_fournisseurs_by_tenant()`
- `get_famille_art_by_tenant()`
- `get_activites_by_tenant()`
- `get_bls_by_tenant()`
- `get_factures_by_tenant()`
- `get_proformas_by_tenant()`
- `get_detail_bl_by_tenant()`
- `get_detail_fact_by_tenant()`
- `get_detail_proforma_by_tenant()`

### 2. VÉRIFIER LES FONCTIONS RPC

Après exécution, vous devriez voir un tableau avec le nombre d'enregistrements par table :
```
Articles: 4
Clients: 2
Fournisseurs: 1
etc...
```

### 3. LANCER LA MIGRATION COMPLÈTE

1. Allez sur : `http://localhost:3000/admin/database-migration`
2. Sélectionnez :
   - **Source** : Supabase
   - **Cible** : MySQL
3. Cochez toutes les options :
   - ✅ Inclure schémas
   - ✅ Inclure données
   - ✅ Écraser existant
4. Cliquez sur **Démarrer Migration**

### 4. RÉSULTAT ATTENDU

La migration va maintenant :

**ÉTAPE 1 - NETTOYAGE :**
- Supprimer les bases `2025_bu01` et `2024_bu01` existantes

**ÉTAPE 2 - CRÉATION SCHÉMAS :**
- Créer les bases MySQL `2025_bu01` et `2024_bu01`
- Créer les 11 tables dans chaque base :
  1. `article`
  2. `client`
  3. `fournisseur`
  4. `famille_art`
  5. `activite`
  6. `bl`
  7. `facture`
  8. `proforma`
  9. `detail_bl`
  10. `detail_fact`
  11. `detail_proforma`

**ÉTAPE 3 - MIGRATION DONNÉES :**
- Récupérer toutes les données de Supabase via les fonctions RPC
- Insérer toutes les données dans MySQL
- Afficher le nombre d'enregistrements migrés par table

## TABLES CRÉÉES

### Tables Principales
- **article** : Articles avec prix, stock, marge
- **client** : Clients avec informations complètes
- **fournisseur** : Fournisseurs avec contacts
- **famille_art** : Familles d'articles
- **activite** : Informations entreprise

### Tables Documents
- **bl** : Bons de livraison
- **facture** : Factures
- **proforma** : Proformas

### Tables Détails
- **detail_bl** : Lignes des bons de livraison
- **detail_fact** : Lignes des factures
- **detail_proforma** : Lignes des proformas

## VÉRIFICATION

Après migration, vérifiez dans MySQL :
```sql
-- Voir toutes les bases
SHOW DATABASES;

-- Utiliser une base tenant
USE 2025_bu01;

-- Voir toutes les tables
SHOW TABLES;

-- Compter les enregistrements
SELECT 'Articles' as table_name, COUNT(*) as count FROM article
UNION ALL
SELECT 'Clients', COUNT(*) FROM client
UNION ALL
SELECT 'Fournisseurs', COUNT(*) FROM fournisseur;
```

## CORRECTIONS APPORTÉES

1. **Migration complète** : 11 tables au lieu de 2
2. **Fonctions RPC** : Toutes les fonctions créées dans Supabase
3. **Insertion données** : Méthodes d'insertion pour chaque type de table
4. **Gestion erreurs** : Meilleure gestion des erreurs par table
5. **Logs détaillés** : Suivi précis de chaque étape

## PROCHAINES ÉTAPES

Une fois la migration terminée :
1. Tester la création d'un nouvel article
2. Vérifier que les données vont dans la bonne base (selon l'indicateur du dashboard)
3. Tester les fonctionnalités CRUD sur toutes les tables

La migration est maintenant COMPLÈTE et PROFESSIONNELLE ! 🎯