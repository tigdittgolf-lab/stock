# ÉTAPE 1 - ANALYSE DE VOTRE BASE SUPABASE

## 🎯 OBJECTIF
Avant de faire la migration, nous devons connaître la VRAIE structure de votre base Supabase.

## 📋 INSTRUCTIONS

### 1. Ouvrez Supabase SQL Editor
Allez sur votre projet Supabase → SQL Editor

### 2. Exécutez cette requête pour voir VOS schémas :
```sql
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name LIKE '%_bu%' 
ORDER BY schema_name;
```

**RÉSULTAT ATTENDU :**
```
schema_name
-----------
2025_bu01
2024_bu01
...
```

### 3. Exécutez cette requête pour voir TOUTES vos tables dans un schéma :
```sql
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = '2025_bu01' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**RÉSULTAT ATTENDU :**
```
table_name       | table_type
-----------------|-----------
activite         | BASE TABLE
article          | BASE TABLE
bl               | BASE TABLE
client           | BASE TABLE
detail_bl        | BASE TABLE
detail_fact      | BASE TABLE
detail_proforma  | BASE TABLE
facture          | BASE TABLE
famille_art      | BASE TABLE
fournisseur      | BASE TABLE
proforma         | BASE TABLE
... (et peut-être d'autres tables)
```

### 4. Comptez vos enregistrements :
```sql
-- Articles
SELECT COUNT(*) as total FROM "2025_bu01".article;

-- Clients
SELECT COUNT(*) as total FROM "2025_bu01".client;

-- Fournisseurs
SELECT COUNT(*) as total FROM "2025_bu01".fournisseur;

-- BL
SELECT COUNT(*) as total FROM "2025_bu01".bl;

-- Factures
SELECT COUNT(*) as total FROM "2025_bu01".facture;
```

### 5. Voir la structure d'une table (exemple: article) :
```sql
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_schema = '2025_bu01' 
  AND table_name = 'article'
ORDER BY ordinal_position;
```

## 📊 PARTAGEZ LES RÉSULTATS

Une fois que vous avez exécuté ces requêtes, partagez-moi :

1. **Combien de schémas** vous avez (2025_bu01, 2024_bu01, etc.)
2. **Combien de tables** dans chaque schéma
3. **Les noms de TOUTES les tables** (pas seulement les 11 que j'ai supposées)
4. **Le nombre d'enregistrements** dans chaque table

Avec ces informations, je pourrai corriger le service de migration pour qu'il copie EXACTEMENT votre structure réelle.

## ⚠️ IMPORTANT

La migration actuelle ne fonctionne pas car :
- Elle ne trouve pas vos schémas (retourne `[]`)
- Elle suppose une structure qui n'est peut-être pas la vôtre
- Elle ne peut pas copier ce qu'elle ne voit pas

Une fois que j'aurai les vraies informations, je corrigerai le code pour qu'il fonctionne avec VOTRE base de données réelle ! 🎯