# Intégration des Informations d'Entreprise depuis la Table Activité

## Problème Résolu

La table `activite` contient les informations de l'entreprise (raison sociale, adresse, téléphone, etc.) et existe dans le schéma `public`, pas dans les schémas tenant (`2025_bu01`, etc.). Les PDFs utilisaient des informations statiques au lieu des vraies données de l'entreprise.

## Solution Implémentée

### 1. Fonction RPC pour Accéder aux Données Entreprise

**Fichier**: `backend/COMPANY_INFO_RPC_FUNCTION.sql`

```sql
CREATE OR REPLACE FUNCTION get_company_info()
RETURNS TABLE (
  domaine_activite TEXT,
  sous_domaine TEXT,
  raison_sociale TEXT,
  adresse TEXT,
  commune TEXT,
  wilaya TEXT,
  tel_fixe TEXT,
  tel_port TEXT,
  nrc TEXT,
  nis TEXT,
  art TEXT,
  ident_fiscal TEXT,
  banq TEXT
) 
SECURITY DEFINER
```

Cette fonction accède au schéma `public.activite` et retourne toutes les informations de l'entreprise.

### 2. Service CompanyService

**Fichier**: `backend/src/services/companyService.ts`

#### Fonctionnalités :
- ✅ **Cache intelligent** : Met en cache les données pendant 5 minutes
- ✅ **Fallback** : Utilise des valeurs par défaut si la DB est inaccessible
- ✅ **Formatage automatique** : Formate l'adresse complète (adresse + commune + wilaya)
- ✅ **Mapping intelligent** : Mappe les champs de la DB vers l'interface CompanyInfo

#### Méthodes principales :
```typescript
// Récupère les infos de l'entreprise (avec cache)
static async getCompanyInfo(): Promise<CompanyInfo>

// Formate l'en-tête pour les documents
static async getFormattedHeader(): Promise<string>

// Récupère tous les détails formatés
static async getCompanyDetails(): Promise<{...}>
```

### 3. Service PDF Modifié

**Fichier**: `backend/src/services/pdfService.ts`

#### Changements :
- ✅ **Méthodes async** : Toutes les méthodes de génération PDF sont maintenant async
- ✅ **Données dynamiques** : Récupère les infos entreprise depuis la DB à chaque génération
- ✅ **Informations complètes** : Affiche domaine d'activité, sous-domaine, téléphones, etc.

#### Nouvelles signatures :
```typescript
async generateInvoice(invoiceData: InvoiceData): Promise<jsPDF>
async generateDeliveryNote(deliveryData: DeliveryNoteData): Promise<jsPDF>
async generateSmallDeliveryNote(deliveryData: DeliveryNoteData): Promise<jsPDF>
async generateTicketReceipt(deliveryData: DeliveryNoteData): Promise<jsPDF>
async generateProforma(invoiceData: InvoiceData): Promise<jsPDF>
```

### 4. Routes PDF Mises à Jour

**Fichier**: `backend/src/routes/pdf.ts`

- ✅ **Suppression des infos statiques** : Plus de `companyInfo` hardcodé
- ✅ **Appels async** : Tous les appels aux méthodes PDF utilisent `await`
- ✅ **Gestion d'erreurs** : Fallback automatique si la DB est inaccessible

## Informations Affichées dans les PDFs

### En-tête Entreprise (Tous les documents)
```
RAISON SOCIALE DE L'ENTREPRISE
Domaine d'activité - Sous-domaine
Adresse complète, Commune, Wilaya
Tél: +213 XX XX XX XX
Mobile: +213 XX XX XX XX (si disponible)
Email: contact@entreprise.dz (généré automatiquement)
NIF: XXXXXXXXXXXXXXX
RC: XX/XX-XXXXXXX
Art: XXXXXXX (si disponible)
```

### Données Récupérées de la Table `activite`
- **raison_sociale** → Nom de l'entreprise
- **domaine_activite** → Secteur d'activité
- **sous_domaine** → Spécialisation
- **adress** → Adresse principale
- **commune** → Commune
- **wilaya** → Wilaya
- **tel_fixe** → Téléphone principal
- **tel_port** → Téléphone mobile
- **nrc** → Numéro de registre de commerce
- **nis** → Numéro d'identification statistique
- **ident_fiscal** → Identifiant fiscal (NIF)
- **art** → Numéro d'article d'imposition
- **banq** → Informations bancaires

## Avantages

### ✅ **Données Centralisées**
- Une seule source de vérité dans `public.activite`
- Modification des infos entreprise = mise à jour automatique des PDFs

### ✅ **Performance Optimisée**
- Cache de 5 minutes pour éviter les requêtes répétées
- Fallback rapide en cas de problème DB

### ✅ **Flexibilité**
- Supporte les entreprises avec/sans certaines informations
- Génération automatique d'email basée sur la raison sociale

### ✅ **Conformité**
- Affichage de tous les identifiants légaux (NIF, RC, Art)
- Format professionnel pour tous les documents

## Utilisation

### Pour Tester
1. **Vérifier la table activite** :
   ```sql
   SELECT * FROM public.activite LIMIT 1;
   ```

2. **Tester la fonction RPC** :
   ```sql
   SELECT * FROM get_company_info();
   ```

3. **Générer un PDF** et vérifier que les vraies informations apparaissent

### Pour Modifier les Infos Entreprise
1. **Mettre à jour la table activite** :
   ```sql
   UPDATE public.activite SET 
     raison_sociale = 'NOUVELLE RAISON SOCIALE',
     adress = 'Nouvelle adresse',
     tel_fixe = '+213 XX XX XX XX'
   WHERE id = 1;
   ```

2. **Vider le cache** (optionnel) :
   ```typescript
   CompanyService.clearCache();
   ```

3. **Générer un nouveau PDF** → Les nouvelles infos apparaîtront automatiquement

## Migration des Données

Si la table `activite` est vide ou n'existe pas, le système utilise des valeurs par défaut :
```typescript
{
  name: 'VOTRE ENTREPRISE',
  address: 'Adresse de votre entreprise',
  phone: '+213 XX XX XX XX',
  email: 'contact@entreprise.dz',
  nif: '000000000000000',
  rc: '00/00-0000000'
}
```

## Compatibilité

- ✅ **Rétrocompatible** : Fonctionne même si `activite` est vide
- ✅ **Multi-tenant** : Les infos entreprise sont partagées entre tous les tenants
- ✅ **Tous les formats** : BL Complet, BL Réduit, Ticket, Factures, Proformas