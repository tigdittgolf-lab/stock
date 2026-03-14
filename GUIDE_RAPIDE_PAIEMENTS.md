# Guide Rapide - Système de Paiements 🚀

## 🎯 Installation (5 minutes)

### Étape 1: Exécuter les scripts SQL

#### Pour Supabase (Cloud):
1. Ouvrir le dashboard Supabase
2. Aller dans "SQL Editor"
3. Copier le contenu de `ADD_DUE_DATE_TO_PAYMENTS.sql`
4. Cliquer sur "Run"

#### Pour MySQL (Local):
1. Ouvrir phpMyAdmin
2. Sélectionner votre base de données
3. Aller dans l'onglet "SQL"
4. Copier le contenu de `ADD_DUE_DATE_TO_PAYMENTS_MYSQL.sql`
5. Cliquer sur "Exécuter"

### Étape 2: Redémarrer le backend
```bash
cd backend
bun dev
```

### Étape 3: C'est prêt! ✅

---

## 📱 Accès Rapide aux Fonctionnalités

### Depuis les listes de documents

**Liste des BL** (`/delivery-notes/list`):
- Bouton "💰 Ajouter Paiement" → Ajouter un paiement
- Bouton "📜 Historique" → Voir les paiements

**Liste des Factures** (`/invoices/list`):
- Bouton "💰 Ajouter Paiement" → Ajouter un paiement
- Bouton "📜 Historique" → Voir les paiements

### Pages principales

| Page | URL | Description |
|------|-----|-------------|
| 🚨 Alertes | `/payments/overdue` | Paiements en retard |
| 📅 Échéancier | `/payments/schedule` | Toutes les échéances |
| 📊 Rapports | `/payments/report` | Statistiques complètes |
| 👤 Historique Client | `/clients/[id]/payments` | Tous les paiements d'un client |

---

## 🎬 Cas d'Usage Courants

### 1. Client paie partiellement à la livraison

**Scénario:** Créer un BL de 10,000 DA, client paie 5,000 DA

1. Créer le BL normalement
2. Cocher "Paiement partiel"
3. Saisir 5,000 DA
4. Choisir "Espèces"
5. Enregistrer

**Résultat:** BL créé avec solde de 5,000 DA

---

### 2. Client paie le reste plus tard

**Scénario:** Compléter le paiement du BL précédent

1. Aller dans "Liste des BL"
2. Trouver le BL (filtre "Partiellement payé")
3. Cliquer "💰 Ajouter Paiement"
4. Saisir 5,000 DA (ou moins)
5. Choisir la méthode
6. Enregistrer

**Résultat:** Solde mis à jour automatiquement

---

### 3. Voir tous les paiements d'un client

**Scénario:** Client demande un relevé de ses paiements

1. Aller dans "Liste des Clients"
2. Cliquer sur le client
3. Aller dans l'onglet "Paiements" (ou `/clients/[id]/payments`)

**Résultat:** Liste complète avec total payé

---

### 4. Identifier les retards de paiement

**Scénario:** Fin de mois, vérifier les impayés

1. Aller dans `/payments/overdue`
2. Voir la liste triée par urgence
3. Contacter les clients en rouge (+30 jours)

**Résultat:** Liste des retards avec montants et jours

---

### 5. Générer un rapport mensuel

**Scénario:** Rapport des paiements de janvier

1. Aller dans `/payments/report`
2. Sélectionner "Du: 01/01/2025" et "Au: 31/01/2025"
3. Voir les statistiques
4. Cliquer "📥 Exporter CSV" si besoin

**Résultat:** Rapport complet avec graphiques

---

### 6. Planifier les échéances

**Scénario:** Voir les paiements à venir cette semaine

1. Aller dans `/payments/schedule`
2. Filtrer par "À venir"
3. Vérifier les échéances de la semaine

**Résultat:** Liste des paiements à prévoir

---

## 💡 Astuces

### Filtrer rapidement les documents impayés
Dans la liste des BL/Factures:
- Utiliser le filtre "Statut de paiement"
- Sélectionner "Non payé" ou "Partiellement payé"

### Définir une échéance lors du paiement
Lors de l'ajout d'un paiement:
- Remplir le champ "Date d'échéance" (optionnel)
- Le paiement apparaîtra dans l'échéancier

### Exporter les données
Dans le rapport:
- Cliquer "📥 Exporter CSV"
- Ouvrir dans Excel/LibreOffice
- Créer vos propres graphiques

### Suivre un client spécifique
- Aller dans `/clients/[id]/payments`
- Voir l'historique complet
- Total payé affiché en haut

---

## 🎨 Codes Couleur

### Statuts de paiement
- 🟢 **Vert**: Payé / À venir
- 🟡 **Jaune**: Partiellement payé / Aujourd'hui
- 🔴 **Rouge**: Non payé / En retard

### Urgence des retards
- 🟡 **Jaune**: 1-15 jours de retard
- 🟠 **Orange**: 16-30 jours de retard
- 🔴 **Rouge**: Plus de 30 jours de retard

---

## ⚠️ Points Importants

### Saisie des montants
- Utiliser le **point** (.) comme séparateur décimal
- Exemple: 1500.50 (pas 1500,50)
- Le champ a `lang="en"` pour forcer le point

### Validation automatique
- Le montant ne peut pas dépasser le solde
- Le montant doit être > 0
- Message d'erreur si validation échoue

### Calcul automatique
- Le solde est calculé automatiquement
- Le statut est mis à jour en temps réel
- Les statistiques sont recalculées

---

## 🆘 Problèmes Courants

### "Erreur lors de l'enregistrement"
**Solution:** Vérifier que les scripts SQL sont exécutés

### "Montant invalide"
**Solution:** Utiliser le point (.) pas la virgule (,)

### "Document non trouvé"
**Solution:** Vérifier que le document existe dans la base

### "Tenant header required"
**Solution:** Se reconnecter à l'application

---

## 📊 Statistiques Disponibles

### Dans le rapport (`/payments/report`)
- Total des paiements (montant et nombre)
- Paiement moyen
- Répartition par type de document
- Répartition par méthode de paiement
- Évolution mensuelle

### Dans les alertes (`/payments/overdue`)
- Nombre de paiements en retard
- Montant total en retard
- Retard moyen (jours)
- Retard maximum (jours)

### Dans l'échéancier (`/payments/schedule`)
- Total des échéances
- À venir (nombre)
- Aujourd'hui (nombre)
- En retard (nombre)

---

## 🚀 Workflow Recommandé

### Quotidien
1. Vérifier `/payments/schedule` → Échéances du jour
2. Vérifier `/payments/overdue` → Nouveaux retards

### Hebdomadaire
1. Contacter les clients avec retards > 15 jours
2. Vérifier les échéances de la semaine prochaine

### Mensuel
1. Générer le rapport dans `/payments/report`
2. Exporter en CSV pour comptabilité
3. Analyser les tendances

---

## 📞 Besoin d'Aide?

1. Consulter `PAYMENT_SYSTEM_COMPLETE_FINAL.md` pour la doc complète
2. Vérifier les logs dans la console du navigateur (F12)
3. Vérifier les logs backend dans le terminal

---

## ✅ Checklist de Démarrage

- [ ] Scripts SQL exécutés
- [ ] Backend redémarré
- [ ] Testé l'ajout d'un paiement
- [ ] Testé l'historique
- [ ] Testé le rapport
- [ ] Testé les alertes
- [ ] Testé l'échéancier

**Une fois tout coché, vous êtes prêt! 🎉**
