# Instructions pour Exécuter les Fonctions RPC Stock

## Étapes à Suivre

1. **Ouvrir Supabase Dashboard**
   - Allez sur https://supabase.com/dashboard
   - Connectez-vous à votre projet

2. **Accéder à l'Éditeur SQL**
   - Dans le menu de gauche, cliquez sur "SQL Editor"
   - Ou utilisez le raccourci dans la barre de navigation

3. **Exécuter le Script**
   - Ouvrez le fichier `backend/FONCTIONS_RPC_STOCK.sql`
   - Copiez tout le contenu du fichier
   - Collez-le dans l'éditeur SQL de Supabase
   - Cliquez sur "Run" pour exécuter le script

4. **Vérification**
   - Le script devrait s'exécuter sans erreur
   - Vous devriez voir un message de succès
   - Les 5 fonctions RPC seront créées :
     - `get_stock_overview`
     - `get_stock_by_article`
     - `get_stock_alerts`
     - `get_stock_valuation`
     - `insert_stock_adjustment`

5. **Actualiser l'Application**
   - Retournez à l'application
   - Actualisez la page de gestion du stock
   - Les données en temps réel devraient maintenant s'afficher

## Fonctionnalités Activées

Après l'exécution, vous aurez accès à :

- **Vue d'ensemble complète** : Statistiques globales du stock
- **Valorisation détaillée** : Prix d'achat vs prix de vente
- **Analyse par type** : Séparation stock BL vs stock Factures
- **Alertes intelligentes** : Ruptures, stock faible, surstock
- **Ajustements de stock** : Corrections manuelles avec historique

## En Cas de Problème

Si vous rencontrez des erreurs :
1. Vérifiez que vous êtes connecté au bon projet Supabase
2. Assurez-vous d'avoir les permissions d'administration
3. Contactez le support technique si nécessaire

---

**Note** : Cette configuration n'est nécessaire qu'une seule fois par tenant/schéma.