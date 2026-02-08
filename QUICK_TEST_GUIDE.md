# 🚀 Guide rapide de test - Système de paiement

## ✅ Serveur démarré
- **URL:** http://localhost:3000
- **Statut:** ✅ En cours d'exécution

---

## 🎯 Test en 5 minutes

### 1️⃣ Ouvrir l'application
```
http://localhost:3000
```

### 2️⃣ Aller sur un bon de livraison
- Menu > Bons de livraison > Liste
- Cliquez sur un BL existant

### 3️⃣ Enregistrer un paiement
1. Cliquez sur **"💰 Enregistrer un paiement"**
2. Remplissez:
   - Date: aujourd'hui
   - Montant: 5000 DA
   - Mode: Espèces
3. Cliquez sur **"Enregistrer"**

### 4️⃣ Vérifier le résultat
- ✅ Le widget "Statut de paiement" se met à jour
- ✅ Le statut change (Non payé → Partiellement payé)
- ✅ Le solde est recalculé

### 5️⃣ Voir l'historique
- Cliquez sur **"Voir l'historique →"**
- Vous voyez votre paiement
- Testez: ✏️ Modifier | 🗑️ Supprimer

---

## 🧪 Tests rapides

### Test A: Paiement partiel
```
Document: 10 000 DA
Paiement: 5 000 DA
Résultat: 🟡 Partiellement payé (50%)
```

### Test B: Paiement complet
```
Document: 10 000 DA
Paiement 1: 5 000 DA
Paiement 2: 5 000 DA
Résultat: 🟢 Payé (100%)
```

### Test C: Dashboard des impayés
```
URL: http://localhost:3000/payments/outstanding
Actions: Filtrer, Rechercher, Trier
```

---

## 🔧 Commandes utiles

### Arrêter le serveur
```bash
Ctrl + C
```

### Redémarrer
```bash
cd frontend
npm run dev
```

### Tester l'API
```bash
# Voir le solde d'un BL
curl "http://localhost:3000/api/payments/balance?documentType=delivery_note&documentId=1" -H "X-Tenant: 2025_bu01"
```

---

## 📊 Statuts de paiement

| Statut | Couleur | Condition |
|--------|---------|-----------|
| Non payé | 🔴 | Aucun paiement |
| Partiellement payé | 🟡 | 0% < Payé < 100% |
| Payé | 🟢 | Payé = 100% |
| Trop-perçu | 🔵 | Payé > 100% |

---

## 🐛 Problème?

### Le widget ne s'affiche pas
1. F12 > Console
2. Vérifiez les erreurs
3. Vérifiez Network > API calls

### Erreur API
1. Vérifiez que le serveur tourne
2. Vérifiez l'URL: http://localhost:3000
3. Vérifiez la console du serveur

---

## 📚 Documentation complète
- `SERVEUR_DEMARRE_PRET_POUR_TESTS.md` - Guide détaillé
- `INTEGRATION_GUIDE_STEP_BY_STEP.md` - Guide d'intégration
- `PAYMENT_TRACKING_IMPLEMENTATION_SUMMARY.md` - Documentation complète

---

## ✅ Checklist rapide
- [ ] Serveur démarré
- [ ] Application ouverte
- [ ] Widget visible sur BL
- [ ] Paiement créé
- [ ] Historique visible
- [ ] Dashboard accessible

**Tout fonctionne?** 🎉 Le système est opérationnel!
