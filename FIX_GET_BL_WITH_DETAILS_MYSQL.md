# Fix: Implémentation de get_bl_with_details pour MySQL

## Problème
Lorsqu'on clique sur un BL dans la liste, l'application essaie de charger les détails via la fonction RPC `get_bl_with_details`, mais cette fonction n'était pas implémentée pour MySQL:

```
❌ Failed to fetch REAL BL details: {message: "RPC function get_bl_with_details not implemented for mysql"}
```

## Solution Appliquée

### 1. Ajout du case dans convertRPCToSQL
**Fichier**: `backend/src/services/databaseService.ts` (ligne ~1293)

```typescript
case 'get_bl_with_details':
  return this.getBLWithDetails(dbType, params.p_tenant, params.p_nfact);
```

### 2. Implémentation de la méthode getBLWithDetails
**Fichier**: `backend/src/services/databaseService.ts` (après getBLById, ligne ~2870)

```typescript
private async getBLWithDetails(dbType: 'mysql' | 'postgresql', tenant: string, nfact: number): Promise<any> {
  try {
    console.log(`📋 Fetching BL with details: ${nfact} from tenant: ${tenant} (${dbType})`);
    
    // Récupérer le BL avec getBLById qui fait déjà tout le travail
    const blResult = await this.getBLById(dbType, tenant, nfact.toString());
    
    if (!blResult.success || !blResult.data) {
      console.log(`❌ BL ${nfact} not found`);
      return { success: false, error: 'BL not found' };
    }
    
    const blData = blResult.data;
    
    // Formater la réponse dans le format attendu par le frontend (compatible avec PostgreSQL RPC)
    const response = {
      success: true,
      data: {
        // En-tête du BL
        nfact: blData.nbl || blData.nfact,
        nbl: blData.nbl || blData.nfact,
        nclient: blData.nclient,
        client_name: blData.client_name,
        client_address: blData.client_address,
        client_phone: blData.client_phone,
        date_fact: blData.date_fact,
        date_bl: blData.date_bl || blData.date_fact,
        montant_ht: blData.montant_ht,
        tva: blData.tva,
        timbre: blData.timbre,
        autre_taxe: blData.autre_taxe,
        montant_ttc: blData.montant_ttc,
        // Détails des articles
        details: blData.details || []
      }
    };
    
    console.log(`✅ BL ${nfact} fetched with ${response.data.details.length} details`);
    return response;
    
  } catch (error) {
    console.error(`❌ ${dbType}: Error fetching BL with details ${nfact}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
```

## Fonctionnement

La nouvelle méthode `getBLWithDetails`:
1. Réutilise la méthode existante `getBLById` qui fait déjà tout le travail de récupération des données
2. Formate la réponse dans le format attendu par le frontend
3. Retourne un objet avec `success: true` et `data` contenant:
   - Toutes les informations du BL (numéro, client, dates, montants)
   - Les détails des articles (narticle, designation, qte, prix, tva, total_ligne)

## Test

Pour tester:
1. Redémarrer le backend: `npm run dev` dans le dossier `backend`
2. Aller sur la liste des BLs
3. Cliquer sur un BL pour voir ses détails
4. Vérifier dans la console backend qu'il n'y a plus l'erreur "RPC function get_bl_with_details not implemented for mysql"

## Corrections Supplémentaires

Pendant la correction, j'ai également fixé:
- **articles.ts**: Suppression de code dupliqué dans le try-catch
- **paymentRepository.ts**: Ajout des méthodes manquantes pour compléter la classe

## Statut

✅ Implémentation terminée
⚠️ Nécessite redémarrage du backend pour prendre effet
