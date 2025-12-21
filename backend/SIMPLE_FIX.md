# Solution Simple pour Corriger les BL

## Problème
L'endpoint `/api/sales/delivery-notes` utilise des données simulées au lieu de la fonction RPC.

## Solution Rapide

### Étape 1 : Restaurer le Fichier
```bash
cd backend
git checkout HEAD -- src/routes/sales-clean.ts
```

### Étape 2 : Test Direct de la Fonction RPC
Au lieu de modifier l'endpoint, testons directement la fonction RPC via l'API.

### Étape 3 : Créer un Endpoint de Test
Créons un endpoint temporaire `/api/sales/delivery-notes-real` qui utilise la fonction RPC.

## Test Immédiat

Vous pouvez tester la fonction RPC directement dans Supabase :
```sql
SELECT * FROM get_bl_list_by_tenant('2025_bu01');
```

Cela vous donnera les vraies données que nous voulons voir dans l'interface.

## Priorité : Rapport des Ventes

Le plus important est que le **Rapport des Ventes** fonctionne avec les vraies données.

Avez-vous testé le rapport des ventes après avoir exécuté `backend/SALES_REPORT_RPC_CORRECT.sql` ?