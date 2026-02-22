# Instructions pour exécuter la fonction de mise à jour des BL d'achat

## Étape 1: Ouvrir Supabase SQL Editor

1. Allez sur https://szgodrjglbpzkrksnroi.supabase.co
2. Cliquez sur "SQL Editor" dans le menu de gauche
3. Cliquez sur "New query"

## Étape 2: Copier et exécuter le SQL

Copiez tout le contenu du fichier `CREATE_UPDATE_PURCHASE_BL_FUNCTIONS.sql` et collez-le dans l'éditeur SQL.

Cliquez sur "Run" pour exécuter.

## Étape 3: Vérifier la création

Vous devriez voir un message de succès indiquant que la fonction a été créée.

## Étape 4: Redémarrer le backend

Après avoir exécuté le SQL, redémarrez votre serveur backend:

```bash
cd backend
npm run dev
```

## Étape 5: Tester la modification

1. Allez sur http://localhost:3001/purchases/delivery-notes/list
2. Cliquez sur un BL pour voir les détails
3. Cliquez sur "Modifier"
4. Modifiez les quantités, prix, ou ajoutez/supprimez des articles
5. Cliquez sur "Enregistrer les modifications"
6. Vérifiez que les changements sont bien sauvegardés

## Note importante

La fonction SQL utilise `SECURITY DEFINER` ce qui signifie qu'elle s'exécute avec les privilèges du créateur de la fonction. Assurez-vous que votre utilisateur Supabase a les permissions nécessaires sur les tables `bachat` et `bachat_detail`.
