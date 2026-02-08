# 📘 Guide d'intégration étape par étape - Système de paiements

Ce guide vous montre exactement comment intégrer le système de paiements dans votre application existante.

## 🎯 Vue d'ensemble

Vous avez 3 fichiers à modifier et 2 configurations à faire :

1. **Backend** : Configurer les routes API
2. **Base de données** : Exécuter les migrations
3. **Page de détail BL** : Ajouter les composants de paiement
4. **Page de détail Facture** : Ajouter les composants de paiement
5. **Menu de navigation** : Ajouter le lien vers le dashboard

---

## ✅ ÉTAPE 1 : Exécuter les migrations de base de données

### Pour MySQL :

```bash
mysql -u root -p stock_management < backend/migrations/create_payments_table_mysql.sql
```

### Pour PostgreSQL :

```bash
psql -U postgres -d stock_management < backend/migrations/create_payments_table_postgresql.sql
```

### Vérifier que la table est créée :

```sql
-- MySQL
DESCRIBE payments;

-- PostgreSQL
\d payments
```

Vous devriez voir une table avec les colonnes : `id`, `tenant_id`, `document_type`, `document_id`, `payment_date`, `amount`, `payment_method`, `notes`, etc.

---

## ✅ ÉTAPE 2 : Configurer les routes backend

### Trouver votre fichier serveur principal

Cherchez un fichier comme :
- `backend/server.ts`
- `backend/index.ts`
- `backend/app.ts`

### Ajouter les imports en haut du fichier :

```typescript
import { createPaymentRoutes } from './routes/payments';
import { MySQLPaymentRepository } from './repositories/PaymentRepository';
import mysql from 'mysql2/promise';
```

### Créer le pool de connexion MySQL (si pas déjà fait) :

```typescript
const mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3307'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'stock_management'
});
```

### Ajouter les routes de paiement :

```typescript
// Créer le repository
const paymentRepository = new MySQLPaymentRepository(mysqlPool);

// Ajouter les routes (AVANT vos autres routes)
app.use('/api/payments', createPaymentRoutes(paymentRepository));
```

### Exemple complet :

```typescript
import express from 'express';
import { createPaymentRoutes } from './routes/payments';
import { MySQLPaymentRepository } from './repositories/PaymentRepository';
import mysql from 'mysql2/promise';

const app = express();

// Middleware
app.use(express.json());

// Pool MySQL
const mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3307'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'stock_management'
});

// Routes de paiement
const paymentRepository = new MySQLPaymentRepository(mysqlPool);
app.use('/api/payments', createPaymentRoutes(paymentRepository));

// Vos autres routes...
app.use('/api/sales', salesRoutes);
// etc.

app.listen(3000, () => {
    console.log('✅ Server running on port 3000');
    console.log('✅ Payment routes available at /api/payments');
});
```

---

## ✅ ÉTAPE 3 : Intégrer dans la page de détail du bon de livraison

### Fichier à modifier : `frontend/app/delivery-notes/[id]/page.tsx`

J'ai créé un exemple complet dans `frontend/app/delivery-notes/[id]/page-with-payments.tsx`.

### Modifications à faire :

#### 1. Ajouter les imports en haut du fichier :

```typescript
// Ajouter ces imports après vos imports existants
import PaymentSummary from '@/components/payments/PaymentSummary';
import PaymentForm from '@/components/payments/PaymentForm';
import PaymentHistory from '@/components/payments/PaymentHistory';
```

#### 2. Ajouter les états pour les modals :

```typescript
// Dans votre composant, après vos états existants
const [showPaymentForm, setShowPaymentForm] = useState(false);
const [showPaymentHistory, setShowPaymentHistory] = useState(false);
const [refreshPaymentTrigger, setRefreshPaymentTrigger] = useState(0);
```

#### 3. Ajouter les fonctions de gestion :

```typescript
// Fonction pour rafraîchir les paiements après succès
const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setRefreshPaymentTrigger(prev => prev + 1);
};

// Fonction pour rafraîchir après modification/suppression
const handlePaymentChange = () => {
    setRefreshPaymentTrigger(prev => prev + 1);
};

// Fonction pour calculer le montant TTC
const calculateTotalTTC = () => {
    let totalTTC = deliveryNote.montant_ttc;
    if (totalTTC === undefined || totalTTC === null || isNaN(totalTTC)) {
        const montantHT = parseFloat(deliveryNote.montant_ht?.toString() || '0') || 0;
        const tva = parseFloat(deliveryNote.tva?.toString() || '0') || 0;
        totalTTC = montantHT + tva;
    } else {
        totalTTC = parseFloat(totalTTC.toString()) || 0;
    }
    return totalTTC;
};
```

#### 4. Ajouter le bouton "Enregistrer un paiement" dans le header :

```typescript
// Dans votre header, après le bouton "Retour à la liste"
<button 
    onClick={() => setShowPaymentForm(true)}
    className={styles.primaryButton}
    style={{ marginLeft: '10px', backgroundColor: '#10b981' }}
>
    💰 Enregistrer un paiement
</button>
```

#### 5. Ajouter le widget PaymentSummary dans le main :

```typescript
// Dans votre <main>, AVANT l'en-tête du document
<div style={{ marginBottom: '30px' }}>
    <PaymentSummary
        documentType="delivery_note"
        documentId={deliveryNote.nbl}
        totalAmount={calculateTotalTTC()}
        onViewHistory={() => setShowPaymentHistory(true)}
        refreshTrigger={refreshPaymentTrigger}
    />
</div>
```

#### 6. Ajouter les modals à la fin du composant (avant le dernier `</div>`) :

```typescript
{/* Modal de formulaire de paiement */}
{showPaymentForm && (
    <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    }}>
        <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
        }}>
            <PaymentForm
                documentType="delivery_note"
                documentId={deliveryNote.nbl}
                documentNumber={deliveryNote.nbl.toString()}
                documentTotalAmount={calculateTotalTTC()}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPaymentForm(false)}
            />
        </div>
    </div>
)}

{/* Modal d'historique des paiements */}
{showPaymentHistory && (
    <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    }}>
        <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '900px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '20px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Historique des paiements</h2>
                <button
                    onClick={() => setShowPaymentHistory(false)}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    Fermer
                </button>
            </div>
            <PaymentHistory
                documentType="delivery_note"
                documentId={deliveryNote.nbl}
                onPaymentChange={handlePaymentChange}
            />
        </div>
    </div>
)}
```

---

## ✅ ÉTAPE 4 : Intégrer dans la page de détail de facture

### Fichier à modifier : `frontend/app/invoices/[id]/page.tsx`

**C'est exactement la même chose que pour les bons de livraison**, mais avec ces différences :

1. Remplacer `documentType="delivery_note"` par `documentType="invoice"`
2. Utiliser l'ID de la facture au lieu de `deliveryNote.nbl`
3. Adapter les noms de variables (`invoice` au lieu de `deliveryNote`)

### Exemple rapide :

```typescript
// Imports
import PaymentSummary from '@/components/payments/PaymentSummary';
import PaymentForm from '@/components/payments/PaymentForm';
import PaymentHistory from '@/components/payments/PaymentHistory';

// Dans le composant
<PaymentSummary
    documentType="invoice"  // ← Changé ici
    documentId={invoice.id}  // ← Utiliser l'ID de la facture
    totalAmount={calculateTotalTTC()}
    onViewHistory={() => setShowPaymentHistory(true)}
    refreshTrigger={refreshPaymentTrigger}
/>

<PaymentForm
    documentType="invoice"  // ← Changé ici
    documentId={invoice.id}  // ← Utiliser l'ID de la facture
    documentNumber={invoice.numero}
    documentTotalAmount={calculateTotalTTC()}
    onSuccess={handlePaymentSuccess}
    onCancel={() => setShowPaymentForm(false)}
/>

<PaymentHistory
    documentType="invoice"  // ← Changé ici
    documentId={invoice.id}  // ← Utiliser l'ID de la facture
    onPaymentChange={handlePaymentChange}
/>
```

---

## ✅ ÉTAPE 5 : Ajouter le lien vers le dashboard dans le menu

### Trouver votre composant de navigation

Cherchez un fichier comme :
- `frontend/components/Navigation.tsx`
- `frontend/components/Sidebar.tsx`
- `frontend/components/Layout.tsx`
- `frontend/app/layout.tsx`

### Ajouter le lien :

```typescript
import Link from 'next/link';

// Dans votre menu
<Link href="/payments/outstanding">
    💰 Soldes impayés
</Link>

// Ou avec un bouton
<button onClick={() => router.push('/payments/outstanding')}>
    💰 Soldes impayés
</button>
```

### Exemple avec un menu de navigation :

```typescript
<nav>
    <Link href="/dashboard">🏠 Accueil</Link>
    <Link href="/delivery-notes/list">📦 Bons de livraison</Link>
    <Link href="/invoices/list">📄 Factures</Link>
    <Link href="/payments/outstanding">💰 Soldes impayés</Link>  {/* ← Nouveau */}
    <Link href="/clients">👥 Clients</Link>
    <Link href="/products">📦 Produits</Link>
</nav>
```

---

## 🧪 ÉTAPE 6 : Tester l'intégration

### Test 1 : Créer un paiement

1. Allez sur un bon de livraison (ex: `/delivery-notes/1`)
2. Vous devriez voir le widget "Statut de paiement" avec le statut "Non payé"
3. Cliquez sur "💰 Enregistrer un paiement"
4. Remplissez le formulaire :
   - Date : aujourd'hui
   - Montant : 5000 DA (par exemple)
   - Mode de paiement : Espèces
   - Notes : "Premier paiement"
5. Cliquez sur "Enregistrer le paiement"
6. Le widget devrait se mettre à jour automatiquement

### Test 2 : Voir l'historique

1. Dans le widget "Statut de paiement", cliquez sur "Voir l'historique →"
2. Vous devriez voir votre paiement dans le tableau
3. Essayez de modifier le paiement (cliquez sur ✏️)
4. Essayez de supprimer le paiement (cliquez sur 🗑️)

### Test 3 : Dashboard des soldes impayés

1. Allez sur `/payments/outstanding`
2. Vous devriez voir tous les documents avec des soldes impayés
3. Testez les filtres (Type de document, Recherche client)
4. Testez le tri (cliquez sur les en-têtes de colonnes)
5. Cliquez sur une ligne pour aller au détail du document

### Test 4 : Paiement complet

1. Créez un BL de 10 000 DA
2. Enregistrez un paiement de 5 000 DA → Statut "Partiellement payé" 🟡
3. Enregistrez un second paiement de 5 000 DA → Statut "Payé" 🟢
4. Le document ne devrait plus apparaître dans le dashboard des impayés

### Test 5 : Trop-perçu

1. Créez un BL de 10 000 DA
2. Enregistrez un paiement de 12 000 DA → Statut "Trop-perçu" 🔵
3. Le solde devrait être -2 000 DA

---

## 🐛 Dépannage

### Problème : "Cannot find module '@/components/payments/PaymentSummary'"

**Solution :** Vérifiez que les fichiers sont bien dans `frontend/components/payments/`

### Problème : "404 Not Found" sur les API de paiement

**Solution :** Vérifiez que vous avez bien configuré les routes backend (Étape 2)

### Problème : "tenant_id is required"

**Solution :** Assurez-vous que votre middleware d'authentification définit `req.tenantId`

### Problème : Les paiements ne s'affichent pas

**Solution :** 
1. Ouvrez la console du navigateur (F12)
2. Regardez les erreurs dans l'onglet "Console"
3. Regardez les requêtes dans l'onglet "Network"
4. Vérifiez que les requêtes vers `/api/payments` retournent 200

### Problème : "Table 'payments' doesn't exist"

**Solution :** Vous n'avez pas exécuté les migrations (Étape 1)

---

## 📚 Ressources supplémentaires

- **Documentation complète** : `PAYMENT_TRACKING_IMPLEMENTATION_SUMMARY.md`
- **Exemple complet** : `frontend/app/delivery-notes/[id]/page-with-payments.tsx`
- **Guide des composants** : `frontend/components/payments/README.md`
- **Spécifications** : `.kiro/specs/client-payment-tracking/`

---

## ✅ Checklist finale

Avant de considérer l'intégration comme terminée, vérifiez :

- [ ] Migrations de base de données exécutées
- [ ] Routes backend configurées
- [ ] PaymentSummary ajouté dans la page de détail BL
- [ ] PaymentSummary ajouté dans la page de détail Facture
- [ ] Bouton "Enregistrer un paiement" ajouté
- [ ] Modals de formulaire et historique ajoutés
- [ ] Lien vers le dashboard dans le menu
- [ ] Test de création de paiement réussi
- [ ] Test de modification de paiement réussi
- [ ] Test de suppression de paiement réussi
- [ ] Dashboard des impayés accessible et fonctionnel
- [ ] Filtres et tri du dashboard fonctionnent
- [ ] Isolation des tenants vérifiée

---

## 🎉 Félicitations !

Si tous les tests passent, votre système de suivi des paiements est opérationnel ! 

Vous pouvez maintenant :
- Enregistrer des paiements échelonnés
- Suivre les soldes en temps réel
- Voir l'historique complet des paiements
- Identifier rapidement les impayés
- Gérer les trop-perçus

**Besoin d'aide ?** Consultez les fichiers de documentation ou les commentaires dans le code source.
