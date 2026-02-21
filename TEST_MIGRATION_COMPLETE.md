# 🧪 Test de Migration Complète A → Z

## 🎯 Objectif

Tester la capacité du système à:
1. ✅ Se connecter à MySQL
2. ✅ Découvrir une base MySQL existante
3. ✅ Créer un nouveau schéma dans Supabase
4. ✅ Créer toutes les tables dans le nouveau schéma
5. ✅ Migrer toutes les données
6. ✅ Vérifier l'intégrité

## 📊 Bases MySQL Disponibles

D'après les logs de découverte:
- **2025_bu01** - 18 tables ✅
- **2025_bu02** - 26 tables ✅
- **2024_bu01** - 14 tables ✅
- 2025_bu03 - 0 tables (vide)
- 2024_bu02 - 0 tables (vide)
- 2024_bu03 - 0 tables (vide)

## 🔍 Vérification Supabase

Pour choisir une base qui n'existe pas encore dans Supabase, il faut vérifier:

### Option 1: Via SQL Editor Supabase
```sql
-- Lister tous les schémas
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name LIKE '%_bu%'
ORDER BY schema_name;
```

### Option 2: Via l'Interface Supabase
1. Aller sur https://szgodrjglbpzkrksnroi.supabase.co
2. Ouvrir "Table Editor"
3. Regarder la liste des schémas dans le menu déroulant

## 🎯 Recommandation pour le Test

### Scénario Idéal
Choisir une base qui:
- ✅ Existe dans MySQL
- ✅ A des données (tables non vides)
- ❌ N'existe PAS encore dans Supabase

### Bases Candidates
1. **2024_bu01** (14 tables) - Probablement pas encore dans Supabase
2. **2025_bu01** (18 tables) - Peut-être déjà dans Supabase
3. **2025_bu02** (26 tables) - Peut-être déjà dans Supabase

## 📝 Procédure de Test

### Étape 1: Vérifier Supabase
```sql
-- Dans SQL Editor Supabase
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('2024_bu01', '2025_bu01', '2025_bu02')
ORDER BY schema_name;
```

Si le résultat est vide pour une base, c'est parfait pour le test!

### Étape 2: Lancer la Migration
1. Ouvrir http://localhost:3001/admin/database-migration
2. Cliquer "🔍 Découvrir les bases de données"
3. Sélectionner la base qui n'existe pas dans Supabase (ex: **2024_bu01**)
4. Cliquer "▶️ Migrer 1 base(s)"

### Étape 3: Observer la Progression
Le système devrait:
1. ✅ Découvrir les 14 tables de 2024_bu01
2. ✅ Créer le schéma `2024_bu01` dans Supabase
3. ✅ Créer les 14 tables avec leur structure
4. ✅ Migrer toutes les données
5. ✅ Vérifier l'intégrité

### Étape 4: Vérifier le Résultat
Après la migration, vérifier dans Supabase:
```sql
-- Vérifier que le schéma existe
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = '2024_bu01';

-- Lister les tables créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = '2024_bu01'
ORDER BY table_name;

-- Compter les enregistrements
SELECT 
  table_name,
  (SELECT COUNT(*) FROM "2024_bu01"."' || table_name || '") as row_count
FROM information_schema.tables 
WHERE table_schema = '2024_bu01';
```

## 🎯 Recommandation Finale

**Je recommande de tester avec `2024_bu01`** car:
- ✅ Elle existe dans MySQL (14 tables)
- ✅ Elle a probablement des données
- ✅ Elle est probablement absente de Supabase (année 2024)
- ✅ Taille raisonnable pour un test (14 tables)

## 🚀 Commandes Rapides

### Vérifier dans MySQL
```bash
mysql -u root -p
USE 2024_bu01;
SHOW TABLES;
SELECT COUNT(*) FROM article;  # Exemple
```

### Vérifier dans Supabase
```sql
-- SQL Editor Supabase
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = '2024_bu01';
-- Si résultat vide: parfait pour le test!
```

## ✅ Checklist du Test

Avant de lancer:
- [ ] Vérifier que 2024_bu01 existe dans MySQL
- [ ] Vérifier que 2024_bu01 N'existe PAS dans Supabase
- [ ] Sauvegarder Supabase (si données importantes)
- [ ] Lancer la migration
- [ ] Observer les logs en temps réel
- [ ] Vérifier le résultat dans Supabase

## 🎉 Résultat Attendu

Si tout fonctionne:
```
✅ Initialisation: Connexions établies
✅ Découverte: 14 tables RÉELLES découvertes
✅ Validation: Validation de 14 tables...
✅ Nettoyage: Nettoyage complet...
✅ Schémas: Création du schéma 2024_bu01...
✅ Tables: Création de 14 tables réelles...
✅ Données: Migration de toutes les données...
✅ Fonctions RPC: Migration des fonctions RPC...
✅ Vérification: Vérification complète...
✅ Terminé: Migration terminée: 14 tables migrées!
```

---

**Prêt pour le test?** Vérifie d'abord que 2024_bu01 n'existe pas dans Supabase, puis lance la migration! 🚀
