# ⚠️ ATTENTION - MODIFICATION IMPORTANTE DE LA BASE DE DONNÉES

## Ce que vous allez faire

Vous allez **modifier la structure des tables MySQL** pour utiliser des **clés composites** au lieu d'IDs auto-incrémentés.

## Tables concernées

1. `bl_achat` - Bons de livraison d'achats
2. `detail_bl_achat` - Détails des BL
3. `fachat` - Factures d'achats
4. `fachat_detail` - Détails des factures

## Changements

### Avant
```sql
-- Clé primaire = ID auto-incrémenté
bl_achat: nbl_achat (INT AUTO_INCREMENT)
fachat: nfact (INT AUTO_INCREMENT)
```

### Après
```sql
-- Clé primaire = Clé composite naturelle
bl_achat: (numero_bl_fournisseur, nfournisseur)
fachat: (nfact, nfournisseur)
```

## ⚠️ RISQUES

1. **Perte de données** : Si vous avez des données existantes dans `bl_achat` ou `fachat`, elles seront **SUPPRIMÉES** lors de la modification
2. **Références cassées** : Si d'autres tables référencent ces IDs, les contraintes seront cassées
3. **Irréversible** : Une fois modifié, difficile de revenir en arrière

## 🔒 SAUVEGARDE OBLIGATOIRE

**AVANT d'exécuter le script SQL, faites une sauvegarde complète :**

```bash
# Sauvegarder la base de données
mysqldump -u root -p 2025_bu01 > backup_2025_bu01_avant_modification.sql

# Ou sauvegarder juste les tables concernées
mysqldump -u root -p 2025_bu01 bl_achat detail_bl_achat fachat fachat_detail > backup_achats_avant_modification.sql
```

## 📋 ÉTAPES À SUIVRE

### 1. Vérifier les données existantes

```sql
-- Combien de BL d'achats ?
SELECT COUNT(*) FROM bl_achat;

-- Combien de factures d'achats ?
SELECT COUNT(*) FROM fachat;
```

### 2. Si vous avez des données importantes

**Option A** : Exporter les données, modifier la structure, puis réimporter
**Option B** : Créer de nouvelles tables avec la bonne structure et migrer les données

### 3. Si vous n'avez PAS de données importantes (ou juste des tests)

Vous pouvez exécuter directement le script `MODIFIER_TABLES_MYSQL_CLE_COMPOSITE.sql`

```bash
# Dans MySQL Workbench ou ligne de commande
mysql -u root -p 2025_bu01 < MODIFIER_TABLES_MYSQL_CLE_COMPOSITE.sql
```

## ✅ Après la modification

1. Vérifier la structure :
```bash
node check-mysql-tables.js
```

2. Tester le système :
```bash
node test-purchases-composite-key.js
```

## 🔄 Alternative : Créer de nouvelles tables

Si vous voulez garder les anciennes données, créez de nouvelles tables :

```sql
-- Renommer les anciennes tables
RENAME TABLE bl_achat TO bl_achat_old;
RENAME TABLE fachat TO fachat_old;

-- Créer les nouvelles tables avec la bonne structure
-- (voir le script de création)
```

## ❓ Questions à vous poser

1. **Avez-vous des données importantes dans `bl_achat` et `fachat` ?**
   - Si OUI → Faites une sauvegarde et planifiez une migration
   - Si NON → Vous pouvez modifier directement

2. **D'autres tables référencent-elles ces IDs ?**
   - Vérifiez les contraintes de clés étrangères

3. **Êtes-vous sûr de vouloir cette structure ?**
   - Clé composite = Pas d'ID simple
   - Plus complexe pour les relations
   - Mais correspond à votre logique métier

## 💡 Recommandation

Si vous débutez avec cette base de données et n'avez pas de données de production, **modifiez directement la structure**.

Si vous avez des données de production, **contactez-moi pour un plan de migration détaillé**.
