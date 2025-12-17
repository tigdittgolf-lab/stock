# Instructions pour Exécuter les Fonctions RPC Activité

## Étapes à Suivre

1. **Ouvrir Supabase Dashboard**
   - Allez sur https://supabase.com/dashboard
   - Connectez-vous à votre projet

2. **Accéder à l'Éditeur SQL**
   - Dans le menu de gauche, cliquez sur "SQL Editor"
   - Ou utilisez le raccourci dans la barre de navigation

3. **Exécuter le Script**
   - Ouvrez le fichier `backend/FONCTIONS_RPC_ACTIVITE.sql`
   - Copiez tout le contenu du fichier
   - Collez-le dans l'éditeur SQL de Supabase
   - Cliquez sur "Run" pour exécuter le script

4. **Vérification**
   - Le script devrait s'exécuter sans erreur
   - Vous devriez voir un message de succès
   - Les 4 fonctions RPC seront créées :
     - `get_activities_by_tenant`
     - `insert_activity_to_tenant`
     - `update_activity_in_tenant`
     - `delete_activity_from_tenant`

5. **Actualiser l'Application**
   - Retournez à l'application
   - Allez dans Paramètres → Activités Entreprise
   - Les fonctionnalités CRUD devraient maintenant fonctionner

## Fonctionnalités Activées

Après l'exécution, vous aurez accès à :

- **Création d'activités** : Ajouter de nouvelles entreprises/activités
- **Modification** : Éditer les informations existantes
- **Suppression** : Supprimer les activités non utilisées
- **Gestion complète** : Nom, adresse, téléphone, email, NIF, RC, activité, slogan

## Structure de la Table Activité

La table `activite` contient les champs suivants :
- `id` : Identifiant unique (auto-incrémenté)
- `nom_entreprise` : Nom de l'entreprise (obligatoire)
- `adresse` : Adresse de l'entreprise
- `telephone` : Numéro de téléphone
- `email` : Adresse email
- `nif` : Numéro d'identification fiscale
- `rc` : Registre de commerce
- `activite` : Description de l'activité
- `slogan` : Slogan de l'entreprise
- `created_at` : Date de création

## En Cas de Problème

Si vous rencontrez des erreurs :
1. Vérifiez que vous êtes connecté au bon projet Supabase
2. Assurez-vous d'avoir les permissions d'administration
3. La table sera créée automatiquement si elle n'existe pas
4. Une activité par défaut sera ajoutée lors de la première exécution

---

**Note** : Cette configuration n'est nécessaire qu'une seule fois par tenant/schéma.