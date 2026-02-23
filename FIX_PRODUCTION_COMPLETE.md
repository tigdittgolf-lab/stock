# Fix Production Complet - Toutes les Routes Corrigées

## Problèmes Identifiés

1. **BL d'achat détails**: 404 sur `/api/purchases/delivery-notes/29/ATIA`
2. **PDF BL de vente**: 500 sur `/api/pdf/delivery-note/8703`
3. **Settings activities**: 500 sur `/api/settings/activities`
4. **Multiples routes**: Utilisaient des URLs hardcodées (Tailscale ou Cloudflare)

## Solutions Appliquées

### 1. Route Dynamique BL d'Achat (Commit: e83e1f6)
Créé: `frontend/app/api/purchases/delivery-notes/[nfact]/[nfournisseur]/route.ts`
- Supporte GET et PUT
- Utilise `BACKEND_URL`
- Proxy vers le backend via ngrok

### 2. Correction Routes Critiques (Commit: 1199d41)
Remplacé toutes les URLs hardcodées par `BACKEND_URL`:

#### Routes PDF Corrigées:
- ✅ `frontend/app/api/pdf/delivery-note/[id]/route.ts`
- ✅ `frontend/app/api/pdf/invoice/[id]/route.ts`
- ✅ `frontend/app/api/pdf/delivery-note-small/[id]/route.ts`
- ✅ `frontend/app/api/pdf/delivery-note-ticket/[id]/route.ts`

#### Routes Settings Corrigées:
- ✅ `frontend/app/api/settings/activities/route.ts`

#### Routes Data Corrigées:
- ✅ `frontend/app/api/clients/route.ts` (GET + POST)
- ✅ `frontend/app/api/suppliers/route.ts` (GET + POST)
- ✅ `frontend/app/api/health/route.ts`

### 3. Pattern de Remplacement Utilisé

**Avant:**
```typescript
const backendUrl = process.env.NODE_ENV === 'production' 
  ? 'https://desktop-bhhs068.tail1d9c54.ts.net/api'
  : 'http://localhost:3005/api';
```

**Après:**
```typescript
const backendUrl = process.env.BACKEND_URL 
  ? `${process.env.BACKEND_URL}/api`
  : 'http://localhost:3005/api';
```

**Ou pour les URLs inline:**
```typescript
const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:3005'}/api/clients`;
```

## Routes Restantes à Corriger

Les routes suivantes utilisent encore des URLs hardcodées mais sont moins critiques:

- `frontend/app/api/sales/proformas/route.ts`
- `frontend/app/api/sales/proforma/[id]/route.ts`
- `frontend/app/api/sales/proforma/route.ts`
- `frontend/app/api/sales/proforma/next-number/route.ts`
- `frontend/app/api/sales/invoices/[id]/route.ts`
- `frontend/app/api/sales/invoices/route.ts`
- `frontend/app/api/sales/delivery-notes/[id]/edit/route.ts`
- `frontend/app/api/rpc/get_fact_for_pdf/route.ts`
- `frontend/app/api/pdf/proforma/[id]/route.ts`
- `frontend/app/api/pdf/debug-bl/[id]/route.ts`
- `frontend/app/api/database/test/route.ts`
- `frontend/app/api/database/switch/route.ts`

## Configuration Requise

### Variable d'Environnement Vercel
Assurez-vous que `BACKEND_URL` est configurée dans Vercel Dashboard:

```
BACKEND_URL=https://karmen-unordainable-irvin.ngrok-free.dev
```

### Ngrok
Ngrok doit être démarré et accessible:
```powershell
.\start-ngrok.ps1
```

URL actuelle: `https://karmen-unordainable-irvin.ngrok-free.dev`

## Résultats Attendus

Après le redéploiement Vercel (automatique):

### BL de Vente
- ✅ Liste des BL fonctionne
- ✅ Détails d'un BL fonctionnent
- ✅ Impression PDF fonctionne
- ✅ Settings/activities fonctionne

### BL d'Achat
- ✅ Liste des BL fonctionne
- ✅ Détails d'un BL fonctionnent (route créée)
- ✅ Modification d'un BL fonctionne

### Autres Fonctionnalités
- ✅ Clients (liste + création)
- ✅ Fournisseurs (liste + création)
- ✅ Health check
- ✅ PDF invoices

## Test de Vérification

Une fois le déploiement terminé:

1. **BL de Vente**:
   - Accéder à la liste des BL
   - Cliquer sur un BL pour voir les détails
   - Imprimer le PDF

2. **BL d'Achat**:
   - Accéder à la liste des BL d'achat
   - Cliquer sur un BL pour voir les détails
   - Vérifier que les données s'affichent

3. **Settings**:
   - Accéder aux paramètres
   - Vérifier que les activités se chargent

## Commits

- `e83e1f6`: feat: Add dynamic route for purchase BL details (nfact/nfournisseur)
- `1199d41`: fix: Replace all hardcoded backend URLs with BACKEND_URL env variable

## Notes

- Tous les changements sont déployés automatiquement par Vercel
- Le déploiement prend environ 1-2 minutes
- Ngrok doit rester actif pour que le backend soit accessible
- La variable `BACKEND_URL` doit être mise à jour si l'URL ngrok change
