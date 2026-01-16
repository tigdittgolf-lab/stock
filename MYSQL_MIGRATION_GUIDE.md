# 🔧 GUIDE DE MIGRATION MYSQL - Déplacer les tables vers stock_management_auth

## ❌ PROBLÈME
Les tables ont été créées dans `2025_bu01` au lieu de `stock_management_auth` car le script a été exécuté dans phpMyAdmin avec la mauvaise base sélectionnée.

## ✅ SOLUTION
Exécuter le script de migration via la ligne de commande MySQL.

## 📋 ÉTAPES À SUIVRE

### 1. Ouvrir PowerShell ou CMD

### 2. Exécuter le script de migration

```powershell
mysql -u root -p < MYSQL_MOVE_TABLES_FROM_2025_BU01.sql
```

**Note:** Le système vous demandera votre mot de passe MySQL root.

### 3. Vérifier que tout est correct

```powershell
mysql -u root -p < verify-mysql-setup.sql
```

## 📊 CE QUE LE SCRIPT VA FAIRE

1. ✅ Créer la base `stock_management_auth` (si elle n'existe pas)
2. 🔄 Déplacer 4 tables de `2025_bu01` vers `stock_management_auth`:
   - `users`
   - `business_units`
   - `user_permissions`
   - `system_logs`
3. 🔧 Recréer toutes les fonctions et procédures dans `stock_management_auth`:
   - `authenticate_user()` - fonction d'authentification avec SHA-256
   - `create_user()` - procédure de création d'utilisateur
   - `update_user()` - procédure de mise à jour
   - `delete_user()` - procédure de suppression
4. 🧪 Tester la fonction `authenticate_user('admin', 'admin123')`

## ⚠️ IMPORTANT

- **NE PAS** exécuter ce script dans phpMyAdmin
- **TOUJOURS** utiliser la ligne de commande pour les scripts MySQL
- Le script utilise `RENAME TABLE` qui est atomique et sûr
- Les données existantes (utilisateur admin) seront préservées

## 🎯 RÉSULTAT ATTENDU

Après l'exécution, vous devriez voir:
- ✅ Tables déplacées vers stock_management_auth
- ✅ Fonctions et procédures recréées dans stock_management_auth
- ✅ Test de authenticate_user réussi
- 🎉 Migration terminée avec succès!

## 🔍 VÉRIFICATION POST-MIGRATION

Le script `verify-mysql-setup.sql` vous montrera:
- Liste des tables dans `stock_management_auth`
- Structure de la table `users`
- Nombre d'utilisateurs (devrait être 1 - admin)
- Liste des fonctions et procédures disponibles
- Test de connexion avec admin/admin123

## 📞 EN CAS DE PROBLÈME

Si vous rencontrez une erreur, copiez-moi le message d'erreur complet et je vous aiderai à la résoudre.
