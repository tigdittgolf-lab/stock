# ✅ Checklist de Migration - Avant de Commencer

## 📋 Pré-requis

### Environnement
- [ ] Node.js installé (v18+)
- [ ] npm ou yarn installé
- [ ] MySQL installé et accessible
- [ ] Compte Supabase actif
- [ ] Navigateur web moderne (Chrome, Firefox, Edge)

### Accès MySQL
- [ ] Host MySQL connu (localhost ou IP)
- [ ] Port MySQL connu (défaut: 3306)
- [ ] Utilisateur MySQL avec permissions
- [ ] Mot de passe MySQL
- [ ] Bases de données accessibles

### Accès Supabase
- [ ] URL Supabase disponible
- [ ] Service Role Key disponible (pas anon key!)
- [ ] Accès au SQL Editor Supabase
- [ ] Permissions admin sur le projet

## 🔧 Configuration

### 1. Fonctions RPC Supabase
- [ ] Fichier `CREATE_DISCOVERY_RPC_FUNCTIONS.sql` présent
- [ ] Accès à https://szgodrjglbpzkrksnroi.supabase.co/project/_/sql
- [ ] Fonctions RPC exécutées avec succès
- [ ] Vérification: 5 fonctions créées
  - [ ] `discover_tenant_schemas()`
  - [ ] `discover_schema_tables(TEXT)`
  - [ ] `discover_table_structure(TEXT, TEXT)`
  - [ ] `get_all_table_data(TEXT, TEXT)`
  - [ ] `create_schema_if_not_exists(TEXT)`

### 2. Application Frontend
- [ ] Dossier `frontend/` présent
- [ ] Dépendances installées (`npm install`)
- [ ] Fichier `.env` configuré (si nécessaire)
- [ ] Application démarre (`npm run dev`)
- [ ] Accès à http://localhost:3001

### 3. Fichiers de Migration
- [ ] `frontend/app/admin/database-migration/page.tsx` présent
- [ ] `frontend/lib/database/true-migration-service.ts` présent
- [ ] `frontend/lib/database/complete-discovery-service.ts` présent
- [ ] `frontend/app/api/admin/migration/route.ts` présent
- [ ] `frontend/app/api/admin/discover-mysql-databases/route.ts` présent

## 🧪 Tests Préliminaires

### Test MySQL
```bash
# Tester connexion MySQL
mysql -h localhost -P 3306 -u root -p

# Lister les bases
SHOW DATABASES;

# Vérifier bases tenant
SHOW DATABASES LIKE '%_bu%';

# Quitter
EXIT;
```
- [ ] Connexion MySQL réussie
- [ ] Bases tenant visibles
- [ ] Permissions suffisantes

### Test Supabase
```bash
# Tester avec curl (remplacer URL et KEY)
curl -X POST 'https://szgodrjglbpzkrksnroi.supabase.co/rest/v1/rpc/discover_tenant_schemas' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```
- [ ] Connexion Supabase réussie
- [ ] Fonctions RPC accessibles
- [ ] Retourne liste de schémas

### Test Interface Web
- [ ] Page http://localhost:3001/admin accessible
- [ ] Lien "Migration de Données" visible
- [ ] Page http://localhost:3001/admin/database-migration accessible
- [ ] Formulaire de configuration visible
- [ ] Boutons "Découvrir" et "Tester" visibles

## 📊 Données à Migrer

### Inventaire Source (MySQL)
- [ ] Nombre de bases tenant: _______
- [ ] Noms des bases: _______________________
- [ ] Nombre total de tables: _______
- [ ] Nombre total d'enregistrements (estimé): _______
- [ ] Taille totale (estimée): _______ MB/GB

### Espace Cible (Supabase)
- [ ] Plan Supabase: Free / Pro / Team / Enterprise
- [ ] Limite de stockage: _______ GB
- [ ] Espace disponible: _______ GB
- [ ] Espace nécessaire: _______ GB
- [ ] Marge suffisante: [ ] Oui [ ] Non

## ⚠️ Sauvegardes

### Avant Migration
- [ ] Sauvegarde MySQL créée
  ```bash
  mysqldump -u root -p --all-databases > backup_mysql_$(date +%Y%m%d).sql
  ```
- [ ] Sauvegarde Supabase créée (si données existantes)
- [ ] Sauvegardes stockées en lieu sûr
- [ ] Sauvegardes testées (restauration possible)

## 🎯 Plan de Migration

### Stratégie
- [ ] Migration complète: [ ] Oui [ ] Non
- [ ] Migration partielle: [ ] Oui [ ] Non
  - [ ] Bases sélectionnées: _______________________
- [ ] Migration de test d'abord: [ ] Oui [ ] Non
- [ ] Fenêtre de maintenance planifiée: [ ] Oui [ ] Non
  - [ ] Date/heure: _______________________

### Ordre de Migration
1. [ ] Base de test (si disponible)
2. [ ] Bases les moins critiques
3. [ ] Bases critiques
4. [ ] Vérification complète

## 🚨 Plan de Rollback

### En cas d'échec
- [ ] Procédure de rollback définie
- [ ] Sauvegardes accessibles
- [ ] Temps de restauration estimé: _______ minutes
- [ ] Personnes à contacter: _______________________

### Critères d'échec
- [ ] Erreur de connexion persistante
- [ ] Perte de données détectée
- [ ] Corruption de données
- [ ] Temps de migration > _______ heures
- [ ] Erreurs critiques > _______ %

## 📞 Contacts

### Support Technique
- [ ] Administrateur MySQL: _______________________
- [ ] Administrateur Supabase: _______________________
- [ ] Développeur responsable: _______________________
- [ ] Support d'urgence: _______________________

## ✅ Validation Finale

### Avant de Lancer
- [ ] Tous les pré-requis validés
- [ ] Tous les tests préliminaires réussis
- [ ] Sauvegardes créées et vérifiées
- [ ] Plan de migration défini
- [ ] Plan de rollback prêt
- [ ] Équipe informée
- [ ] Fenêtre de maintenance confirmée (si applicable)

### Checklist de Lancement
- [ ] Ouvrir http://localhost:3001/admin/database-migration
- [ ] Entrer configuration MySQL
- [ ] Cliquer "Découvrir les bases"
- [ ] Vérifier liste des bases
- [ ] Sélectionner bases à migrer
- [ ] Cliquer "Tester les connexions"
- [ ] Vérifier que tout est OK
- [ ] Lire l'avertissement
- [ ] Cliquer "Migrer X base(s)"
- [ ] NE PAS fermer la page
- [ ] Suivre la progression
- [ ] Attendre "Migration terminée"

## 📊 Après Migration

### Vérifications
- [ ] Tous les schémas créés dans Supabase
- [ ] Toutes les tables créées
- [ ] Nombre d'enregistrements correct
- [ ] Pas d'erreurs dans les logs
- [ ] Fonctions RPC fonctionnelles
- [ ] Application fonctionne avec nouvelles données

### Tests Fonctionnels
- [ ] Connexion à l'application
- [ ] Lecture des données
- [ ] Écriture des données
- [ ] Recherche/filtrage
- [ ] Rapports/exports
- [ ] Toutes fonctionnalités critiques

### Documentation
- [ ] Logs de migration sauvegardés
- [ ] Résumé de migration documenté
- [ ] Problèmes rencontrés notés
- [ ] Solutions appliquées documentées
- [ ] Équipe informée du succès

## 🎉 Migration Réussie!

Si toutes les cases sont cochées:
- ✅ Migration complète et vérifiée
- ✅ Application fonctionnelle
- ✅ Données intègres
- ✅ Équipe informée

**Félicitations! Votre migration est terminée avec succès!** 🎊

---

## 📝 Notes

Utilisez cet espace pour noter des informations spécifiques à votre migration:

```
Date de migration: _______________________
Durée totale: _______________________
Bases migrées: _______________________
Tables migrées: _______________________
Enregistrements migrés: _______________________
Problèmes rencontrés: _______________________
Solutions appliquées: _______________________
```
