# Fonctionnalité de Suivi des Paiements

## Vue d'ensemble
Système de suivi des paiements pour les bons de livraison (BL) et les factures, permettant d'enregistrer les paiements totaux ou partiels lors de la création des documents.

## Modifications apportées

### 1. Backend - Endpoints de paiement (`backend/src/routes/sales-clean.ts`)

#### POST /api/sales/payments
Enregistre un nouveau paiement pour un document (BL ou facture).

**Paramètres requis:**
- `document_type`: 'delivery_note' ou 'invoice'
- `document_id`: Numéro du document
- `payment_date`: Date du paiement
- `amount`: Montant versé (doit être > 0)

**Paramètres optionnels:**
- `payment_method`: Méthode de paiement (cash, check, bank_transfer, credit_card, other)
- `notes`: Notes additionnelles

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "tenant_id": "2009_bu02",
    "document_type": "delivery_note",
    "document_id": 8707,
    "payment_date": "2026-03-13",
    "amount": 61.88,
    "payment_method": "cash",
    "notes": null
  }
}
```

#### GET /api/sales/payments/:documentType/:documentId
Récupère tous les paiements d'un document spécifique.

**Réponse:**
```json
{
  "success": true,
  "data": {
    "payments": [...],
    "total_paid": 61.88,
    "count": 1
  }
}
```

### 2. Frontend - Formulaire BL (`frontend/app/delivery-notes/page.tsx`)

#### Nouveaux états ajoutés:
```typescript
const [paymentType, setPaymentType] = useState<'total' | 'partial'>('total');
const [paymentAmount, setPaymentAmount] = useState<number>(0);
const [paymentMethod, setPaymentMethod] = useState<string>('cash');
const [paymentNotes, setPaymentNotes] = useState<string>('');
```

#### Section paiement dans le formulaire:
- **Type de paiement**: Total (défaut) ou Partiel
- **Montant versé**: Affiché uniquement si paiement partiel
- **Méthode de paiement**: Espèces, Chèque, Virement, Carte, Autre
- **Notes**: Champ optionnel pour commentaires
- **Alerte reste à payer**: Affichée automatiquement si paiement partiel

### 3. Frontend - Formulaire Facture (`frontend/app/invoices/page.tsx`)

Mêmes modifications que pour le formulaire BL.

### 4. Structure de la table `payments`

```sql
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    document_type VARCHAR(20) NOT NULL,  -- 'delivery_note' ou 'invoice'
    document_id BIGINT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_document_type CHECK (document_type IN ('delivery_note', 'invoice'))
);
```

## Flux d'utilisation

### Création d'un BL/Facture avec paiement total (défaut)
1. Utilisateur remplit le formulaire normalement
2. Section paiement affiche "Paiement total" par défaut
3. Sélectionne la méthode de paiement (Espèces par défaut)
4. Clique sur "Créer le Bon de Livraison" / "Créer la Facture"
5. Système crée le document ET enregistre automatiquement le paiement total

### Création d'un BL/Facture avec paiement partiel
1. Utilisateur remplit le formulaire normalement
2. Dans section paiement, sélectionne "Paiement partiel"
3. Saisit le montant versé (peut être 0)
4. Sélectionne la méthode de paiement
5. Ajoute des notes si nécessaire (ex: "Premier versement")
6. Système affiche le reste à payer
7. Clique sur "Créer le Bon de Livraison" / "Créer la Facture"
8. Système crée le document ET enregistre le paiement partiel

## Compatibilité

- ✅ Supabase (PostgreSQL)
- ✅ MySQL local
- ✅ Multi-tenant (isolation par tenant_id)

## Prochaines étapes possibles

1. **Page de gestion des paiements**: Voir tous les paiements d'un client
2. **Ajout de paiements ultérieurs**: Permettre d'ajouter des paiements après création du document
3. **Rapport de paiements**: Statistiques sur les paiements reçus
4. **Alertes de dette**: Notifier les clients avec paiements en retard
5. **Historique des paiements**: Afficher l'historique dans les détails du document

## Notes importantes

- Le paiement est enregistré APRÈS la création réussie du document
- Si l'enregistrement du paiement échoue, le document est quand même créé (erreur loggée en console)
- Le montant du paiement ne peut pas dépasser le total TTC du document
- Les paiements sont isolés par tenant (multi-tenant)
