# 🚀 GUIDE COMPLET DE REPRODUCTION DE LA BASE DE DONNÉES

Ce guide vous permet de reproduire complètement votre système de gestion de stock multi-tenant avec toutes les données.

## 📋 CONTENU FOURNI

### 1. **COMPLETE_DATABASE_BACKUP.sql**
- Script SQL complet avec toutes les tables, fonctions et données
- Prêt à exécuter dans une nouvelle base Supabase
- Inclut le système multi-tenant complet

### 2. **export-current-data.ts**
- Script pour exporter vos données actuelles
- Génère un fichier SQL avec vos vraies données
- Sauvegarde complète personnalisée

### 3. **deploy-complete-system.ts**
- Script de déploiement automatique
- Exécute le déploiement par sections
- Vérification automatique

## 🎯 MÉTHODES DE REPRODUCTION

### 📄 **MÉTHODE 1 : Script SQL Direct (Recommandée)**

1. **Ouvrir votre dashboard Supabase**
   ```
   https://supabase.com/dashboard/project/rslmihwmfdepvsuvqzna
   ```

2. **Aller dans SQL Editor**
   - Cliquez sur "SQL Editor" dans le menu de gauche

3. **Exécuter le script complet**
   - Copiez tout le contenu de `COMPLETE_DATABASE_BACKUP.sql`
   - Collez dans l'éditeur SQL
   - Cliquez sur "Run"

4. **Vérifier le résultat**
   - Allez dans "Table Editor"
   - Vérifiez que les schémas `2025_bu01`, `2025_bu02` existent
   - Vérifiez que la table `activite1` contient vos données

### 🤖 **MÉTHODE 2 : Déploiement Automatique**

1. **Exécuter le script de déploiement**
   ```bash
   cd backend
   bun run deploy-complete-system.ts
   ```

2. **Suivre les logs**
   - Le script affiche le progrès en temps réel
   - Vérification automatique à la fin

### 💾 **MÉTHODE 3 : Export Personnalisé**

1. **Exporter vos données actuelles**
   ```bash
   cd backend
   bun run export-current-data.ts
   ```

2. **Utiliser le fichier généré**
   - Un fichier `database-export-YYYY-MM-DD.sql` sera créé
   - Exécutez ce fichier dans votre nouvelle base

## 🏗️ STRUCTURE CRÉÉE

### 📊 **Schémas Multi-Tenants**
```
📁 Votre Base Supabase
├── 📂 public
│   └── 📋 activite1 (données NetBeans originales)
├── 📂 2025_bu01 (Tenant BU01)
│   ├── 📋 activite (infos entreprise)
│   ├── 📋 famille_art, fournisseur, client
│   ├── 📋 article (avec stock)
│   ├── 📋 fact, detail_fact (factures)
│   ├── 📋 bl, detail_bl (bons de livraison)
│   ├── 📋 fprof, detail_fprof (proformas)
│   └── 📋 stock_movements
├── 📂 2025_bu02 (Tenant BU02)
│   └── 📋 (même structure que BU01)
└── 📂 2024_bu01 (Exercice précédent)
    └── 📋 (même structure)
```

### 🔧 **Fonctions RPC Créées**
- `create_tenant_tables(schema_name)` - Créer tables pour un tenant
- `copy_activite1_to_tenant(tenant)` - Copier données entreprise
- `get_company_info(tenant)` - Récupérer infos entreprise
- `create_delivery_note(tenant, client, items)` - Créer bon de livraison

### 📋 **Données Incluses**
- **Entreprise** : ETS BENAMAR BOUZID MENOUAR
- **Adresse** : 10, Rue Belhandouz A.E.K, Mostaganem
- **Contact** : (213)045.42.35.20, outillagesaada@gmail.com
- **Identifiants** : NRC, NIS, NIF complets
- **Articles d'exemple** : Perceuse, lampe, clé à molette
- **Clients d'exemple** : 2 clients de test

## 🎯 APRÈS LA REPRODUCTION

### 1. **Configurer l'Application**

Créez un fichier `.env` dans le dossier `backend` :
```env
SUPABASE_URL=https://VOTRE-PROJET.supabase.co
SUPABASE_SERVICE_ROLE_KEY=VOTRE-CLE-SERVICE-ROLE
```

### 2. **Démarrer les Serveurs**

```bash
# Backend (port 3005)
cd backend
bun install
bun run index.ts

# Frontend (port 3000)
cd frontend
bun install
bun run dev
```

### 3. **Tester le Système**

1. **Ouvrir** : http://localhost:3000
2. **Sélectionner tenant** : 2025_bu01
3. **Aller aux bons de livraison**
4. **Vérifier** : Les infos d'entreprise s'affichent correctement
5. **Générer un PDF** : Doit contenir "ETS BENAMAR BOUZID MENOUAR"

## 🔍 VÉRIFICATIONS

### ✅ **Base de Données**
```sql
-- Vérifier les schémas
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name LIKE '%bu%';

-- Vérifier les données entreprise
SELECT * FROM get_company_info('2025_bu01');

-- Vérifier les tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = '2025_bu01';
```

### ✅ **Application**
- [ ] Backend démarre sur port 3005
- [ ] Frontend démarre sur port 3000
- [ ] Sélection de tenant fonctionne
- [ ] Données d'entreprise s'affichent
- [ ] PDFs générés avec bonnes infos
- [ ] Multi-tenant fonctionne (BU01 ≠ BU02)

## 🆘 DÉPANNAGE

### ❌ **Erreur "exec_sql not found"**
```sql
-- Créer la fonction exec_sql si nécessaire
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS TABLE(result JSON)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE sql;
    RETURN QUERY SELECT '{"success": true}'::JSON;
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT json_build_object('error', SQLERRM);
END;
$$;
```

### ❌ **Erreur de permissions**
```sql
-- Accorder toutes les permissions nécessaires
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon;
```

### ❌ **Données manquantes**
```bash
# Re-exécuter la copie des données
cd backend
bun -e "
import { supabaseAdmin } from './src/supabaseClient.js';
supabaseAdmin.rpc('copy_activite1_to_tenant', { p_tenant: '2025_bu01' })
  .then(result => console.log('Résultat:', result));
"
```

## 🎉 RÉSULTAT FINAL

Après avoir suivi ce guide, vous aurez :

- ✅ **Système identique** à votre installation actuelle
- ✅ **Multi-tenant** avec BU01, BU02, etc.
- ✅ **Données réelles** de votre entreprise
- ✅ **PDFs personnalisés** avec vos informations
- ✅ **Architecture complète** prête pour production
- ✅ **Évolutivité** pour ajouter de nouveaux tenants

**Votre système de gestion de stock multi-tenant sera complètement opérationnel !** 🚀

## 📞 SUPPORT

Si vous rencontrez des problèmes :
1. Vérifiez les logs du déploiement
2. Consultez la section dépannage
3. Exécutez les vérifications une par une
4. Utilisez le dashboard Supabase pour inspecter les données

**Bonne reproduction de votre système !** 🎯