# 📖 Exemple d'Utilisation Complète

Ce document montre un exemple complet d'utilisation du système de synchronisation, de l'installation à la vérification.

---

## 🎬 Scénario

Vous avez développé de nouvelles fonctions et procédures dans la base `2025_bu01` et vous devez les déployer vers toutes les autres bases (`2024_bu01`, `2024_bu02`, `2024_bu03`, etc.).

---

## 📝 Étape par étape

### 1. Installation initiale

```bash
# Cloner ou naviguer vers le projet
cd votre-projet

# Installer les dépendances
npm install
```

**Sortie attendue :**
```
added 15 packages in 3s
```

---

### 2. Configuration

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer avec vos credentials
notepad .env  # Windows
nano .env     # Linux/Mac
```

**Contenu de .env :**
```env
DB_HOST=db.abcdefghijklmn.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=votre-super-mot-de-passe-secret
```

---

### 3. Test de connexion

```bash
npm run test-connection
```

**Sortie attendue :**
```
╔════════════════════════════════════════════════════════╗
║  Test de Connexion à la Base de Données               ║
╚════════════════════════════════════════════════════════╝

📋 Configuration:

   Host: db.abcdefghijklmn.supabase.co
   Port: 5432
   Database: postgres
   User: postgres
   Password: ✅ Défini

🔌 Tentative de connexion...
✅ Connexion réussie !

🔍 Test de requête...
✅ Requête réussie

📊 Version PostgreSQL:
   PostgreSQL 15.1 on x86_64-pc-linux-gnu

🔍 Recherche des schémas tenant...
✅ 4 schéma(s) trouvé(s):

   - 2024_bu01
   - 2024_bu02
   - 2024_bu03
   - 2025_bu01

🔍 Vérification du schéma source (2025_bu01):
✅ Schéma source trouvé

📊 Objets dans 2025_bu01:
   Fonctions: 15
   Procédures: 12

═══════════════════════════════════════════════════════

✅ TOUS LES TESTS SONT PASSÉS

Vous pouvez maintenant exécuter:
   npm run sync-db        (pour synchroniser)
   npm run verify-sync    (pour vérifier)

═══════════════════════════════════════════════════════
```

---

### 4. Synchronisation

```bash
npm run sync-db
```

**Sortie attendue :**
```
╔════════════════════════════════════════════════════════╗
║  Synchronisation des Fonctions et Procédures          ║
║  Source: 2025_bu01                                     ║
╚════════════════════════════════════════════════════════╝

🔌 Connexion à la base de données...
✅ Connecté

🔍 Recherche de tous les schémas tenant...

📊 3 schéma(s) cible(s) trouvé(s):
   - 2024_bu01
   - 2024_bu02
   - 2024_bu03

═══════════════════════════════════════════════════════

📥 EXTRACTION DES DÉFINITIONS

📥 Extraction de authenticate_user...
📥 Extraction de create_user...
📥 Extraction de delete_bl_details...
📥 Extraction de delete_user...
📥 Extraction de insert_bl_detail...
📥 Extraction de update_bl...
📥 Extraction de update_bl_json...
📥 Extraction de update_user...

💾 Définitions sauvegardées dans: database-sync-2026-02-09-143022.sql

═══════════════════════════════════════════════════════

🚀 DÉPLOIEMENT VERS LES SCHÉMAS CIBLES

📦 Déploiement de authenticate_user:
  ✅ Déployé vers 2024_bu01
  ✅ Déployé vers 2024_bu02
  ✅ Déployé vers 2024_bu03

📦 Déploiement de create_user:
  ✅ Déployé vers 2024_bu01
  ✅ Déployé vers 2024_bu02
  ✅ Déployé vers 2024_bu03

📦 Déploiement de delete_bl_details:
  ✅ Déployé vers 2024_bu01
  ✅ Déployé vers 2024_bu02
  ✅ Déployé vers 2024_bu03

📦 Déploiement de delete_user:
  ✅ Déployé vers 2024_bu01
  ✅ Déployé vers 2024_bu02
  ✅ Déployé vers 2024_bu03

📦 Déploiement de insert_bl_detail:
  ✅ Déployé vers 2024_bu01
  ✅ Déployé vers 2024_bu02
  ✅ Déployé vers 2024_bu03

📦 Déploiement de update_bl:
  ✅ Déployé vers 2024_bu01
  ✅ Déployé vers 2024_bu02
  ✅ Déployé vers 2024_bu03

📦 Déploiement de update_bl_json:
  ✅ Déployé vers 2024_bu01
  ✅ Déployé vers 2024_bu02
  ✅ Déployé vers 2024_bu03

📦 Déploiement de update_user:
  ✅ Déployé vers 2024_bu01
  ✅ Déployé vers 2024_bu02
  ✅ Déployé vers 2024_bu03

📄 Rapport sauvegardé dans: database-sync-2026-02-09-143022-report.txt

═══════════════════════════════════════════════════════

📊 RÉSUMÉ DE LA SYNCHRONISATION

   Total d'opérations: 24
   ✅ Réussies: 24
   ❌ Échouées: 0
   ⏭️  Ignorées: 0
   📈 Taux de réussite: 100.0%

═══════════════════════════════════════════════════════

🔌 Connexion fermée
```

---

### 5. Vérification

```bash
npm run verify-sync
```

**Sortie attendue :**
```
╔════════════════════════════════════════════════════════╗
║  Vérification de la Synchronisation                   ║
╚════════════════════════════════════════════════════════╝

✅ Connecté à la base de données

📊 4 schéma(s) trouvé(s):

═══════════════════════════════════════════════════════

MATRICE DE VÉRIFICATION

Schéma               | aut | cre | del | del | ins | upd | upd | upd
--------------------------------------------------------------------
2024_bu01            | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅ 
2024_bu02            | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅ 
2024_bu03            | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅ 
2025_bu01            | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅ 

═══════════════════════════════════════════════════════

RÉSUMÉ DÉTAILLÉ

✅ authenticate_user: présent dans tous les schémas
✅ create_user: présent dans tous les schémas
✅ delete_bl_details: présent dans tous les schémas
✅ delete_user: présent dans tous les schémas
✅ insert_bl_detail: présent dans tous les schémas
✅ update_bl: présent dans tous les schémas
✅ update_bl_json: présent dans tous les schémas
✅ update_user: présent dans tous les schémas

═══════════════════════════════════════════════════════

🎉 SUCCÈS : Tous les objets sont présents dans tous les schémas !

═══════════════════════════════════════════════════════
```

---

### 6. Vérification manuelle (optionnelle)

```sql
-- Vérifier qu'une fonction existe dans tous les schémas
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'authenticate_user'
  AND n.nspname LIKE '%_bu%'
ORDER BY n.nspname;
```

**Résultat attendu :**
```
 schema_name | function_name      | arguments
-------------+--------------------+------------------
 2024_bu01   | authenticate_user  | username text, password text
 2024_bu02   | authenticate_user  | username text, password text
 2024_bu03   | authenticate_user  | username text, password text
 2025_bu01   | authenticate_user  | username text, password text
```

---

### 7. Test fonctionnel

```sql
-- Tester la fonction dans un schéma spécifique
SELECT "2024_bu01".authenticate_user('admin', 'password123');

-- Tester dans un autre schéma
SELECT "2024_bu02".authenticate_user('admin', 'password123');
```

---

## 📁 Fichiers générés

Après la synchronisation, vous trouverez :

### `database-sync-2026-02-09-143022.sql`
```sql
-- =====================================================
-- Synchronisation des fonctions et procédures
-- Source: 2025_bu01
-- Date: 2/9/2026, 2:30:22 PM
-- =====================================================

-- DÉFINITIONS ORIGINALES (2025_bu01)
-- =====================================================

-- FUNCTION: authenticate_user
-- Arguments: username text, password text
-- Returns: TABLE(user_id integer, username text, role text)

CREATE OR REPLACE FUNCTION "2025_bu01".authenticate_user(
    username text,
    password text
)
RETURNS TABLE(user_id integer, username text, role text)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT u.id, u.username, u.role
    FROM "2025_bu01".users u
    WHERE u.username = authenticate_user.username
      AND u.password = crypt(authenticate_user.password, u.password);
END;
$function$;

-- ... (autres définitions)

-- =====================================================
-- DÉPLOIEMENT VERS 2024_bu01
-- =====================================================

-- authenticate_user
CREATE OR REPLACE FUNCTION "2024_bu01".authenticate_user(
    username text,
    password text
)
RETURNS TABLE(user_id integer, username text, role text)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT u.id, u.username, u.role
    FROM "2024_bu01".users u
    WHERE u.username = authenticate_user.username
      AND u.password = crypt(authenticate_user.password, u.password);
END;
$function$;

-- ... (suite)
```

### `database-sync-2026-02-09-143022-report.txt`
```
RAPPORT DE SYNCHRONISATION
============================================================

Date: 2/9/2026, 2:30:22 PM
Schéma source: 2025_bu01

STATISTIQUES GLOBALES
------------------------------------------------------------
Total d'opérations: 24
Réussies: 24
Échouées: 0
Ignorées: 0
Taux de réussite: 100.0%
```

---

## 🔄 Utilisation quotidienne

Une fois configuré, la synchronisation devient très simple :

```bash
# Synchronisation rapide
npm run sync-db

# Avec vérification
npm run sync-db && npm run verify-sync
```

Ou avec PowerShell (Windows) :
```powershell
.\sync-databases.ps1
.\sync-databases.ps1 -Verify
```

Ou avec Batch (Windows) :
```cmd
sync-databases.bat sync
sync-databases.bat verify
```

---

## 🚨 En cas de problème

### Scénario : Erreur lors de la synchronisation

```bash
npm run sync-db
```

**Sortie avec erreur :**
```
📦 Déploiement de update_bl:
  ✅ Déployé vers 2024_bu01
  ❌ Erreur pour 2024_bu02: relation "2024_bu02.bl" does not exist
  ✅ Déployé vers 2024_bu03
```

**Solution :**
1. Consulter le rapport généré
2. Vérifier que la table `bl` existe dans `2024_bu02`
3. Créer la table si nécessaire
4. Relancer la synchronisation

---

### Scénario : Rollback nécessaire

```bash
npm run rollback
```

**Sortie :**
```
╔════════════════════════════════════════════════════════╗
║  ROLLBACK - Suppression des Fonctions/Procédures      ║
║  ⚠️  ATTENTION : Opération destructive                ║
╚════════════════════════════════════════════════════════╝

🔌 Connexion à la base de données...
✅ Connecté

📊 3 schéma(s) cible(s):
   - 2024_bu01
   - 2024_bu02
   - 2024_bu03

🗑️  Objets qui seront supprimés:

Fonctions:
   - authenticate_user

Procédures:
   - create_user
   - delete_bl_details
   - delete_user
   - insert_bl_detail
   - update_bl
   - update_bl_json
   - update_user

⚠️  ATTENTION : Cette opération va supprimer ces objets de TOUS les schémas cibles.
⚠️  Le schéma source (2025_bu01) ne sera PAS affecté.

Êtes-vous sûr de vouloir continuer ? (oui/non) : oui

═══════════════════════════════════════════════════════

🗑️  SUPPRESSION EN COURS

📦 Suppression de la fonction authenticate_user:
  ✅ authenticate_user supprimé de 2024_bu01
  ✅ authenticate_user supprimé de 2024_bu02
  ✅ authenticate_user supprimé de 2024_bu03

... (suite)

═══════════════════════════════════════════════════════

📊 RÉSUMÉ DU ROLLBACK

   Total d'opérations: 24
   ✅ Réussies: 24
   ❌ Échouées: 0
   ⏭️  Ignorées: 0

═══════════════════════════════════════════════════════

✅ Rollback terminé avec succès

🔌 Connexion fermée
```

---

## 🎯 Résumé

1. ✅ Installation : `npm install`
2. ✅ Configuration : `.env`
3. ✅ Test : `npm run test-connection`
4. ✅ Synchronisation : `npm run sync-db`
5. ✅ Vérification : `npm run verify-sync`
6. ✅ Fichiers générés : SQL + rapport
7. ✅ Tests fonctionnels : OK

**Votre système est maintenant synchronisé et prêt à l'emploi !** 🎉
