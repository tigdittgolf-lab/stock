# Problèmes Résolus

## 1. Configuration Base de Données

### Problème
L'application utilisait toujours Supabase même quand vous ne le demandiez pas.

### Solution
Le fichier `backend/database-config.json` était configuré sur Supabase. J'ai changé la configuration pour MySQL:

```json
{
  "type": "mysql",
  "name": "MySQL Local",
  "host": "localhost",
  "port": 3306,
  "user": "root",
  "password": ""
}
```

## 2. Code Article Manquant

### Problème
Les codes articles n'apparaissaient pas dans la liste des articles.

### Solution
La table MySQL utilise `Narticle` (avec majuscule) au lieu de `narticle`. J'ai modifié la requête SQL dans `backend/src/services/databaseService.ts` pour mapper correctement les colonnes:

```sql
SELECT 
  Narticle as narticle,
  famille,
  designation,
  Nfournisseur as nfournisseur,
  prix_unitaire,
  marge,
  tva,
  prix_vente,
  seuil,
  stock_f,
  stock_bl
FROM `${tenant}`.article 
ORDER BY Narticle
```

## 3. Base de Données 2013

### Problème
La base `2013` n'est pas accessible via le driver mysql2 (problème connu avec les noms de bases commençant par un chiffre).

### Solution
Utilisez une des bases existantes qui fonctionnent:
- `2025_bu01` (contient 4 articles de test)
- `2024_bu01` (vide)
- `2009_bu02`, `2025_bu02`, `2026_bu01`, `2099_bu02`

## 4. Erreur React Key Prop

### Problème
```
Each child in a list should have a unique "key" prop
```

### Solution
Le code utilise déjà `key={`${article.narticle}-${index}`}` ce qui est correct. L'erreur devrait disparaître une fois que les articles sont chargés correctement.

## 5. Erreur BL ID

### Problème
```
🚨 CRITICAL: No valid ID found for BL
```

### Solution
Le code vérifie déjà `bl.nbl || bl.id || bl.nfact`. Cette erreur apparaît quand un BL n'a pas d'ID valide dans la base de données.

## Actions à Faire

1. **Changer le tenant dans le frontend**:
   - Ouvrez l'application dans le navigateur
   - Allez dans les paramètres ou reconnectez-vous
   - Sélectionnez `2025_bu01` comme tenant

2. **Ou modifier le localStorage** (dans la console du navigateur):
   ```javascript
   localStorage.setItem('tenantInfo', JSON.stringify({
     schema: '2025_bu01',
     name: 'Business Unit 01 - 2025'
   }));
   location.reload();
   ```

3. **Vérifier que le backend est démarré**:
   - Le backend tourne sur http://localhost:3005
   - Configuration: MySQL Local

## Test de l'API

Pour tester que tout fonctionne:

```powershell
$headers = @{"x-tenant"="2025_bu01"}
$response = Invoke-RestMethod -Uri "http://localhost:3005/api/articles" -Method GET -Headers $headers
$response.data | Format-Table narticle, designation, famille, prix_vente
```

Résultat attendu:
```
narticle designation      famille      prix_vente
-------- -----------      -------      ----------
1000     Gillet jaune     Habillement  1856.40
1112     peinture lavable Peinture     1285.20
142      lampe 12volts    Electricité  207.06
211      cable parabole   Electricité  38.68
```
