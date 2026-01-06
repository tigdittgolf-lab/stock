# 🚨 URGENT: Correction du problème BL ID

## Problème identifié
Vous cliquez sur n'importe quel BL (1, 4, etc.) mais vous voyez toujours les données du BL 5. 

**CAUSE**: Les fonctions RPC Supabase sont manquantes, donc le backend utilise des données mock (toujours BL 5).

## Solution IMMÉDIATE

### Étape 1: Aller dans Supabase
1. Ouvrez votre navigateur
2. Allez sur https://supabase.com
3. Connectez-vous à votre projet
4. Cliquez sur "SQL Editor" dans le menu de gauche

### Étape 2: Exécuter le script SQL
1. Dans l'éditeur SQL, copiez-collez TOUT le contenu du fichier `CREATE_COMPLETE_BL_RPC_FUNCTIONS.sql`
2. Cliquez sur "Run" (Exécuter)
3. Attendez que toutes les fonctions soient créées

### Étape 3: Redémarrer le backend
1. Dans votre terminal, arrêtez le backend (Ctrl+C)
2. Relancez avec: `npm run dev` ou `node backend/index.js`

## Vérification
Après avoir fait ces étapes:
1. Allez sur votre application web
2. Cliquez sur un BL spécifique (ex: BL 1)
3. Vous devriez voir les VRAIES données du BL 1, pas du BL 5

## Logs à surveiller
Dans le terminal backend, vous devriez voir:
- ✅ Au lieu de "using mock data"
- ✅ "Found BL X basic info" (avec le bon numéro)
- ✅ "Retrieved complete BL data X" (avec le bon numéro)

## Si ça ne marche toujours pas
1. Vérifiez que les fonctions RPC ont été créées dans Supabase
2. Redémarrez complètement le backend
3. Videz le cache du navigateur (Ctrl+F5)

---

**IMPORTANT**: Ce problème empêche complètement l'utilisation normale de l'application. Il faut le corriger en priorité absolue.