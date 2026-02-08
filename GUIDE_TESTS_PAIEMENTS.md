# 🧪 Guide de tests - Système de paiements

## ✅ Étape 1 : Vérifier que les migrations sont bien exécutées

Tu as déjà exécuté les scripts sur Supabase. Vérifions que tout est en place :

### 1.1 Ouvrir Supabase SQL Editor

1. Va sur https://szgodrjglbpzkrksnroi.supabase.co
2. Clique sur "SQL Editor" dans le menu de gauche
3. Exécute cette requête pour vérifier la table :

```sql
-- Vérifier que la table existe
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;
```

**Résultat attendu :** Tu devrais voir 10 colonnes :
- id (bigint)
- tenant_id (text)
- document_type (text)
- document_id (integer)
- payment_date (date)
- amount (numeric)
- payment_method (text)
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)

### 1.2 Vérifier les index

```sql
-- Vérifier les index
SELECT 
    indexname, 
    indexdef
FROM pg_indexes
WHERE tablename = 'payments';
```

**Résultat attendu :** Tu devrais voir 3 index :
- payments_pkey (PRIMARY KEY sur id)
- idx_payments_tenant_document (sur tenant_id, document_type, document_id)
- idx_payments_date (sur payment_date)

---

## ✅ Étape 2 : Tester les API Routes (Frontend)

Les API routes sont dans `frontend/app/api/payments/`. Elles utilisent Supabase directement.

### 2.1 Démarrer le serveur frontend

```bash
cd frontend
npm run dev
```

Le serveur devrait démarrer sur http://localhost:3000

### 2.2 Tester avec le script automatique

J'ai créé un script de test `test-payment-api.js`. Pour l'utiliser :

```bash
# Depuis la racine du projet
node test-payment-api.js
```

**Ce script va tester :**
1. ✅ Créer un paiement (POST /api/payments)
2. ✅ Lister les paiements (GET /api/payments)
3. ✅ Calculer le solde (GET /api/payments/balance)
4. ✅ Obtenir les documents impayés (GET /api/payments/outstanding)
5. ✅ Obtenir un paiement spécifique (GET /api/payments/[id])
6. ✅ Modifier un paiement (PUT /api/payments/[id])
7. ✅ Supprimer un paiement (DELETE /api/payments/[id])
8. ✅ Validation - Montant négatif (doit échouer)
9. ✅ Validation - Champs manquants (doit échouer)

### 2.3 Tester manuellement avec curl (optionnel)

Si tu préfères tester manuellement :

```bash
# Test 1: Créer un paiement
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -H "X-Tenant: 2025_bu01" \
  -d '{
    "documentType": "delivery_note",
    "documentId": 1,
    "paymentDate": "2024-02-07",
    "amount": 5000,
    "paymentMethod": "cash",
    "notes": "Test manuel"
  }'

# Test 2: Lister les paiements
curl "http://localhost:3000/api/payments?documentType=delivery_note&documentId=1" \
  -H "X-Tenant: 2025_bu01"

# Test 3: Calculer le solde
curl "http://localhost:3000/api/payments/balance?documentType=delivery_note&documentId=1" \
  -H "X-Tenant: 2025_bu01"
```

---

## ✅ Étape 3 : Tester l'interface utilisateur

Maintenant que les API fonctionnent, testons l'interface.

### 3.1 Aller sur un bon de livraison existant

1. Ouvre ton navigateur sur http://localhost:3000
2. Connecte-toi avec ton compte
3. Va sur la liste des bons de livraison : `/delivery-notes/list`
4. Clique sur un bon de livraison pour voir les détails

**⚠️ PROBLÈME ACTUEL :** La page de détail n'a pas encore les composants de paiement intégrés.

### 3.2 Intégrer les composants dans la page de détail

Je vais maintenant modifier `frontend/app/delivery-notes/[id]/page.tsx` pour ajouter :
- Le widget PaymentSummary
- Le bouton "Enregistrer un paiement"
- Les modals de formulaire et d'historique

---

## ✅ Étape 4 : Tests fonctionnels complets

Une fois l'intégration faite, tu pourras tester :

### Test 1 : Créer un paiement partiel

1. Va sur un BL (ex: BL n°1 de 10 000 DA)
2. Tu devrais voir le widget "Statut de paiement" avec :
   - Montant total : 10 000 DA
   - Montant payé : 0 DA
   - Solde restant : 10 000 DA
   - Statut : 🔴 Non payé
3. Clique sur "💰 Enregistrer un paiement"
4. Remplis le formulaire :
   - Date : aujourd'hui
   - Montant : 5 000 DA
   - Mode de paiement : Espèces
   - Notes : "Premier paiement"
5. Clique sur "Enregistrer le paiement"
6. Le widget devrait se mettre à jour :
   - Montant payé : 5 000 DA
   - Solde restant : 5 000 DA
   - Statut : 🟡 Partiellement payé
   - Barre de progression : 50%

### Test 2 : Compléter le paiement

1. Clique à nouveau sur "💰 Enregistrer un paiement"
2. Remplis le formulaire :
   - Date : aujourd'hui
   - Montant : 5 000 DA
   - Mode de paiement : Chèque
   - Notes : "Solde final"
3. Clique sur "Enregistrer le paiement"
4. Le widget devrait se mettre à jour :
   - Montant payé : 10 000 DA
   - Solde restant : 0 DA
   - Statut : 🟢 Payé
   - Barre de progression : 100%

### Test 3 : Voir l'historique

1. Dans le widget, clique sur "Voir l'historique →"
2. Tu devrais voir un tableau avec 2 paiements :
   - Paiement 1 : 5 000 DA (Espèces)
   - Paiement 2 : 5 000 DA (Chèque)
3. Clique sur ✏️ pour modifier un paiement
4. Change le montant à 6 000 DA
5. Sauvegarde
6. Le widget devrait se mettre à jour :
   - Montant payé : 11 000 DA
   - Solde restant : -1 000 DA
   - Statut : 🔵 Trop-perçu

### Test 4 : Supprimer un paiement

1. Dans l'historique, clique sur 🗑️ pour supprimer un paiement
2. Confirme la suppression
3. Le widget devrait se mettre à jour automatiquement

### Test 5 : Dashboard des impayés

1. Va sur `/payments/outstanding`
2. Tu devrais voir tous les BL et factures avec des soldes impayés
3. Teste les filtres :
   - Type de document : Bon de livraison / Facture
   - Recherche client : tape un nom de client
4. Teste le tri :
   - Clique sur "Montant total" pour trier par montant
   - Clique sur "Solde restant" pour trier par solde
   - Clique sur "Date" pour trier par date
5. Clique sur une ligne pour aller au détail du document

---

## ✅ Étape 5 : Tests de sécurité et isolation

### Test 1 : Isolation des tenants

1. Crée un paiement pour le tenant `2025_bu01`
2. Change le tenant dans localStorage : `localStorage.setItem('selectedTenant', '2025_bu02')`
3. Rafraîchis la page
4. Le paiement ne devrait PAS apparaître (isolation des tenants)

### Test 2 : Validation des montants

1. Essaie de créer un paiement avec un montant négatif
2. Tu devrais voir une erreur : "Le montant doit être supérieur à zéro"
3. Essaie de créer un paiement sans date
4. Tu devrais voir une erreur : "La date est requise"

---

## 🐛 Dépannage

### Problème : "Table 'payments' doesn't exist"

**Solution :** Vérifie que tu as bien exécuté les migrations sur Supabase (Étape 1.1)

### Problème : "404 Not Found" sur /api/payments

**Solution :** 
1. Vérifie que le serveur frontend est démarré (`npm run dev`)
2. Vérifie que les fichiers API existent dans `frontend/app/api/payments/`

### Problème : "Cannot find module '@/components/payments/PaymentSummary'"

**Solution :** Vérifie que les composants existent dans `frontend/components/payments/`

### Problème : Les paiements ne s'affichent pas

**Solution :**
1. Ouvre la console du navigateur (F12)
2. Regarde les erreurs dans l'onglet "Console"
3. Regarde les requêtes dans l'onglet "Network"
4. Vérifie que les requêtes vers `/api/payments` retournent 200

### Problème : "tenant_id is required"

**Solution :** Vérifie que le header `X-Tenant` est bien envoyé dans les requêtes

---

## 📊 Checklist de tests

Avant de considérer le système comme opérationnel :

### Base de données
- [ ] Table `payments` existe dans Supabase
- [ ] Les 10 colonnes sont présentes
- [ ] Les 3 index sont créés
- [ ] Les contraintes (CHECK, NOT NULL) sont en place

### API Routes
- [ ] POST /api/payments fonctionne (création)
- [ ] GET /api/payments fonctionne (liste)
- [ ] GET /api/payments/[id] fonctionne (détail)
- [ ] PUT /api/payments/[id] fonctionne (modification)
- [ ] DELETE /api/payments/[id] fonctionne (suppression)
- [ ] GET /api/payments/balance fonctionne (calcul solde)
- [ ] GET /api/payments/outstanding fonctionne (dashboard)
- [ ] Validation des montants négatifs fonctionne
- [ ] Validation des champs manquants fonctionne

### Interface utilisateur
- [ ] Widget PaymentSummary s'affiche correctement
- [ ] Bouton "Enregistrer un paiement" fonctionne
- [ ] Formulaire de paiement s'ouvre et se ferme
- [ ] Création de paiement fonctionne
- [ ] Widget se met à jour automatiquement après création
- [ ] Historique des paiements s'affiche
- [ ] Modification de paiement fonctionne
- [ ] Suppression de paiement fonctionne
- [ ] Dashboard des impayés accessible
- [ ] Filtres du dashboard fonctionnent
- [ ] Tri du dashboard fonctionne
- [ ] Navigation vers le détail du document fonctionne

### Scénarios métier
- [ ] Paiement partiel → Statut "Partiellement payé" 🟡
- [ ] Paiement complet → Statut "Payé" 🟢
- [ ] Trop-perçu → Statut "Trop-perçu" 🔵
- [ ] Aucun paiement → Statut "Non payé" 🔴
- [ ] Barre de progression affiche le bon pourcentage
- [ ] Solde restant calculé correctement
- [ ] Documents payés n'apparaissent pas dans le dashboard

### Sécurité
- [ ] Isolation des tenants fonctionne
- [ ] Validation des montants négatifs fonctionne
- [ ] Validation des champs requis fonctionne
- [ ] Pas de fuite de données entre tenants

---

## 🎯 Prochaines étapes

Une fois tous les tests passés :

1. **Intégrer dans les factures** : Même chose que pour les BL, mais avec `documentType="invoice"`
2. **Ajouter le lien dans le menu** : Pour accéder au dashboard des impayés
3. **Personnaliser les styles** : Adapter les couleurs à ta charte graphique
4. **Ajouter des notifications** : Toast/snackbar pour confirmer les actions
5. **Exporter les données** : Ajouter un bouton pour exporter en Excel/PDF
6. **Statistiques** : Ajouter des graphiques dans le dashboard

---

## 📞 Besoin d'aide ?

Si tu rencontres un problème :

1. Vérifie la console du navigateur (F12)
2. Vérifie les logs du serveur
3. Vérifie les données dans Supabase SQL Editor
4. Consulte les fichiers de documentation :
   - `INTEGRATION_GUIDE_STEP_BY_STEP.md`
   - `PAYMENT_TRACKING_IMPLEMENTATION_SUMMARY.md`
   - `frontend/components/payments/README.md`

---

## ✅ Résumé

Pour tester le système de paiements :

1. **Vérifier la base de données** (Étape 1)
2. **Tester les API** avec le script automatique (Étape 2)
3. **Intégrer l'interface** dans la page de détail (Étape 3)
4. **Tester les scénarios métier** (Étape 4)
5. **Vérifier la sécurité** (Étape 5)

**Temps estimé :** 30-45 minutes pour tous les tests

Bonne chance ! 🚀
