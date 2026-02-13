# ⚠️ ERREUR CRITIQUE - Perte de Données

## Ce qui s'est passé

J'ai créé un script pour nettoyer les doublons dans vos tables MySQL, mais le script contenait une erreur de logique SQL qui a supprimé presque toutes les données au lieu de supprimer seulement les doublons.

## Données affectées

Toutes les bases de données ont été affectées:
- `2009_bu02`: 8197 articles supprimés, 1284 clients supprimés, 456 fournisseurs supprimés
- `2025_bu01`: 3 articles supprimés, 4 clients supprimés, 2 fournisseurs supprimés  
- `2025_bu02`: 9844 articles supprimés, 1305 clients supprimés, 440 fournisseurs supprimés
- `2026_bu01`: 1 article supprimé, 1 client supprimé, 1 fournisseur supprimé
- `2099_bu02`: 1723 articles supprimés, 1284 clients supprimés, 456 fournisseurs supprimés

## État actuel

Chaque table ne contient plus qu'un seul enregistrement (le premier de chaque table).

## Options de récupération

### 1. Restauration depuis une sauvegarde WAMP

Si vous avez des sauvegardes automatiques de WAMP:
- Vérifiez dans `C:\wamp64\bin\mysql\mysql[version]\data\` pour des fichiers de sauvegarde
- Ou dans le dossier de sauvegarde de phpMyAdmin

### 2. Restauration depuis des fichiers SQL

Vous avez ces fichiers SQL dans le projet:
- `2013.sql` - contient des données de 2013
- `2020_bu02.sql` - contient des données de 2020

Pour restaurer 2020_bu02:
```powershell
& "C:\wamp64\bin\mariadb\mariadb10.6.5\bin\mysql.exe" -u root -e "DROP DATABASE IF EXISTS ``2020_bu02``; CREATE DATABASE ``2020_bu02``;"
Get-Content 2020_bu02.sql | & "C:\wamp64\bin\mariadb\mariadb10.6.5\bin\mysql.exe" -u root 2020_bu02
```

### 3. Restauration depuis Supabase

Si vos données sont synchronisées avec Supabase, vous pouvez les récupérer depuis là:
- Les données dans Supabase sont intactes (le script n'a touché que MySQL)
- Vous pouvez exporter depuis Supabase et réimporter dans MySQL

### 4. Restauration depuis le cache de l'application

L'application frontend peut avoir des données en cache dans localStorage:
- `cached_articles`
- `cached_clients`  
- `cached_suppliers`

Ces données peuvent être exportées et réimportées.

## Prévention future

Pour éviter ce genre de problème à l'avenir:

1. **Toujours faire une sauvegarde avant toute opération de nettoyage**:
```powershell
mysqldump -u root --all-databases > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

2. **Tester sur une copie de la base de données d'abord**

3. **Utiliser des transactions pour pouvoir faire un ROLLBACK**

4. **Analyser d'abord avec un script en lecture seule** (comme `analyze-duplicates-only.js`)

## Mes excuses

Je suis vraiment désolé pour cette erreur. J'aurais dû:
1. Tester le script sur une base de test d'abord
2. Créer une sauvegarde automatique avant d'exécuter
3. Utiliser une logique SQL plus sûre

## Prochaines étapes recommandées

1. Vérifiez si vous avez des sauvegardes WAMP automatiques
2. Si oui, restaurez-les
3. Si non, utilisez Supabase pour récupérer les données
4. Configurez des sauvegardes automatiques quotidiennes

Dites-moi quelle option vous voulez explorer pour récupérer vos données.
