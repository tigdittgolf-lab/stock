# Guide de suppression des doublons

## 📋 Fichiers disponibles

1. **DETECT_DUPLICATES_ONLY.sql** - Détection uniquement (SÉCURISÉ)
2. **REMOVE_DUPLICATES_ALL_TABLES.sql** - Suppression des doublons (ATTENTION)

## 🔍 Étape 1: Détection (OBLIGATOIRE)

Exécutez d'abord le script de détection pour voir l'état actuel:

```sql
-- Exécuter dans Supabase SQL Editor
-- Fichier: DETECT_DUPLICATES_ONLY.sql
```

Ce script vous montrera:
- Nombre de doublons par table
- Détails des enregistrements en doublon
- Pourcentage de doublons
- Résumé global

### Exemple de résultat attendu:

```
=== RÉSUMÉ GLOBAL ===
table_name    | total_rows | unique_keys | doublons_a_supprimer | pourcentage_doublons
--------------+------------+-------------+----------------------+---------------------
Clients       | 1000       | 1000        | 0                    | 0.00
Articles      | 8115       | 8115        | 0                    | 0.00
Fournisseurs  | 456        | 456         | 0                    | 0.00
BL            | 4695       | 4694        | 1                    | 0.02
Factures      | 100        | 100         | 0                    | 0.00
Proformas     | 50         | 50          | 0                    | 0.00
```

## ⚠️ Étape 2: Sauvegarde (CRITIQUE)

Avant de supprimer quoi que ce soit, faites une sauvegarde:

### Option 1: Export Supabase (Recommandé)
1. Allez dans Supabase Dashboard
2. Database → Backups
3. Créez un backup manuel

### Option 2: Export SQL
```sql
-- Export des tables concernées
COPY "2009_bu02".client TO '/tmp/backup_client.csv' CSV HEADER;
COPY "2009_bu02".article TO '/tmp/backup_article.csv' CSV HEADER;
COPY "2009_bu02".fournisseur TO '/tmp/backup_fournisseur.csv' CSV HEADER;
COPY "2009_bu02".bl TO '/tmp/backup_bl.csv' CSV HEADER;
COPY "2009_bu02".fact TO '/tmp/backup_fact.csv' CSV HEADER;
COPY "2009_bu02".proforma TO '/tmp/backup_proforma.csv' CSV HEADER;
```

## 🗑️ Étape 3: Suppression (ATTENTION)

Une fois la sauvegarde faite et les doublons identifiés:

### Option A: Suppression table par table (Recommandé)

Ouvrez `REMOVE_DUPLICATES_ALL_TABLES.sql` et exécutez section par section:

1. **Commencez par les tables simples** (sans dépendances):
   - Clients
   - Articles
   - Fournisseurs

2. **Puis les tables avec détails**:
   - BL (supprime aussi detail_bl)
   - Factures (supprime aussi detail_fact)
   - Proformas (supprime aussi detail_proforma)

### Option B: Suppression complète

Exécutez tout le script `REMOVE_DUPLICATES_ALL_TABLES.sql` d'un coup.

⚠️ **ATTENTION**: Cette option supprime tous les doublons en une fois!

## 🔍 Étape 4: Vérification

Après suppression, ré-exécutez le script de détection:

```sql
-- Fichier: DETECT_DUPLICATES_ONLY.sql
```

Vérifiez que:
- `total_rows` = `unique_keys` pour chaque table
- `doublons_a_supprimer` = 0
- `pourcentage_doublons` = 0.00

## 📊 Logique de conservation

Le script garde toujours l'enregistrement le plus "important":

### Clients
- Garde celui avec le plus grand CA (C_affaire_fact + C_affaire_bl)
- Si égalité, garde le plus récent (ctid)

### Articles
- Garde celui avec le plus grand stock
- Si égalité, garde le plus récent (ctid)

### Fournisseurs
- Garde le plus récent (ctid)

### BL / Factures / Proformas
- Garde celui avec la date la plus récente
- Si égalité, garde le plus récent (ctid)
- Supprime automatiquement les lignes de détail associées

## 🚨 Cas particuliers

### Si vous avez beaucoup de doublons (>10%)

1. Analysez d'abord pourquoi il y a des doublons
2. Vérifiez s'il y a un problème dans le code d'insertion
3. Corrigez le problème avant de supprimer
4. Puis supprimez les doublons

### Si les doublons ont des données différentes

Exemple: BL 8705 existe 2 fois avec des clients différents

```sql
-- Voir les détails
SELECT * FROM "2009_bu02".bl WHERE "NFact" = 8705;
```

Décidez manuellement lequel garder, puis:

```sql
-- Supprimer manuellement celui à supprimer
DELETE FROM "2009_bu02".detail_bl WHERE "NFact" = 8705 AND ctid = 'xxx';
DELETE FROM "2009_bu02".bl WHERE ctid = 'xxx';
```

## 🔄 Prévention future

Pour éviter les doublons à l'avenir:

### 1. Ajouter des contraintes uniques

```sql
-- Clients
ALTER TABLE "2009_bu02".client 
ADD CONSTRAINT unique_client_nclient UNIQUE ("Nclient");

-- Articles
ALTER TABLE "2009_bu02".article 
ADD CONSTRAINT unique_article_narticle UNIQUE ("Narticle");

-- Fournisseurs
ALTER TABLE "2009_bu02".fournisseur 
ADD CONSTRAINT unique_fournisseur_nfournisseur UNIQUE ("Nfournisseur");

-- BL
ALTER TABLE "2009_bu02".bl 
ADD CONSTRAINT unique_bl_nfact UNIQUE ("NFact");

-- Factures
ALTER TABLE "2009_bu02".fact 
ADD CONSTRAINT unique_fact_nfact UNIQUE ("NFact");

-- Proformas
ALTER TABLE "2009_bu02".proforma 
ADD CONSTRAINT unique_proforma_nfact UNIQUE ("NFact");
```

### 2. Vérifier le code d'insertion

Assurez-vous que le code vérifie l'existence avant d'insérer:

```typescript
// Exemple pour BL
const { data: existing } = await supabase
  .from('bl')
  .select('NFact')
  .eq('NFact', blNumber)
  .single();

if (existing) {
  throw new Error(`BL ${blNumber} existe déjà`);
}
```

## 📞 Support

Si vous avez des questions ou des problèmes:
1. Vérifiez d'abord avec DETECT_DUPLICATES_ONLY.sql
2. Faites une sauvegarde
3. Testez sur un petit échantillon d'abord
4. En cas de doute, demandez de l'aide avant de supprimer
