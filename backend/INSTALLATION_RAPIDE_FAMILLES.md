# INSTALLATION RAPIDE - MODULE FAMILLES

## 🎯 OBJECTIF
Faire fonctionner immédiatement le module Réglages pour créer et gérer les familles d'articles.

## ⚡ INSTALLATION EN 2 ÉTAPES

### Étape 1: Créer les Fonctions RPC
**Copiez et exécutez ce script dans Supabase SQL Editor :**

```sql
-- Fonctions RPC pour les familles
CREATE OR REPLACE FUNCTION get_families_by_tenant(p_tenant TEXT)
RETURNS TABLE(famille VARCHAR(50))
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY EXECUTE format('SELECT famille FROM %I.famille_art ORDER BY famille', p_tenant);
EXCEPTION
    WHEN OTHERS THEN
        RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION insert_family_to_tenant(
    p_tenant TEXT,
    p_famille VARCHAR(50)
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('INSERT INTO %I.famille_art (famille) VALUES (%L)', p_tenant, p_famille);
    RETURN 'Famille créée avec succès: ' || p_famille;
EXCEPTION
    WHEN unique_violation THEN
        RETURN 'ERREUR: La famille "' || p_famille || '" existe déjà';
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;
```

### Étape 2: Tester l'Interface
1. **Allez sur** http://localhost:3000/settings
2. **Cliquez sur** "Familles d'Articles"
3. **Créez une famille** (ex: "Electricité")
4. **Vérifiez** qu'elle apparaît dans la liste

## ✅ RÉSULTAT ATTENDU

Après l'installation :
- ✅ **Interface fonctionnelle** pour créer des familles
- ✅ **Notifications de succès** lors de la création
- ✅ **Liste des familles** mise à jour automatiquement
- ✅ **Résolution du problème d'articles** (plus d'erreur de contrainte)

## 🚀 UTILISATION

### Créer des Familles Recommandées
- **Electricité** (câbles, interrupteurs, prises)
- **Plomberie** (tuyaux, robinets, raccords)
- **Outillage** (marteaux, tournevis, clés)
- **Peinture** (peintures, pinceaux, rouleaux)
- **Droguerie** (produits chimiques, nettoyants)
- **Carrelage** (carreaux, colles, joints)

### Après Création des Familles
1. **Retournez au dashboard**
2. **Créez un article** avec une famille existante
3. **L'article sera stocké** dans la vraie base de données !

## 🎉 AVANTAGES

- **Interface professionnelle** et intuitive
- **Gestion complète** des familles (CRUD)
- **Validation automatique** des données
- **Résolution définitive** du problème de contrainte famille
- **Base solide** pour étendre vers d'autres paramètres

Une fois les familles créées, votre problème d'articles sera définitivement résolu !