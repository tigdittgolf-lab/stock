# 🚀 DÉMARRAGE RAPIDE - PAIEMENTS MYSQL

**Temps estimé:** 5 minutes

---

## ✅ PRÉREQUIS

- ✅ WAMP installé et démarré
- ✅ MySQL sur port 3307
- ✅ Base `stock_management` existe
- ✅ Table `payments` créée

---

## 🎯 ÉTAPES RAPIDES

### 1. Vérifier que tout est en place (30 secondes)

```powershell
# Vérifier MySQL
Get-Service | Where-Object {$_.Name -like "*mysql*"}

# Vérifier la table
&"C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe" -u root -P 3307 -e "USE stock_management; SHOW TABLES;"
```

**Résultat attendu:** Vous devez voir `payments` dans la liste des tables.

---

### 2. Tester les APIs (1 minute)

```powershell
# Exécuter le script de test
.\test-mysql-payments.ps1
```

**Résultat attendu:** Tous les tests passent ✅

---

### 3. Démarrer l'application (1 minute)

```bash
cd frontend
npm run dev
```

**Résultat attendu:** Serveur démarre sur http://localhost:3000

---

### 4. Configurer MySQL dans l'interface (2 minutes)

1. Ouvrir http://localhost:3000
2. Aller dans **Paramètres** (icône ⚙️)
3. Cliquer sur **Configuration Base de Données**
4. Sélectionner **MySQL Local**
5. Remplir:
   ```
   Host: localhost
   Port: 3307
   Database: stock_management
   User: root
   Password: (laisser vide)
   ```
6. Cliquer **Tester la connexion** → ✅
7. Cliquer **Activer cette base** → ✅

---

### 5. Tester un paiement (1 minute)

1. Aller dans **Bons de livraison**
2. Sélectionner un BL existant (ou en créer un)
3. Cliquer sur **💰 Enregistrer un paiement**
4. Remplir:
   ```
   Date: (aujourd'hui)
   Montant: 5000
   Mode: Espèces
   Notes: Test MySQL
   ```
5. Cliquer **Enregistrer** → ✅

---

## ✅ VÉRIFICATION FINALE

### Dans l'application
- Le widget de paiement affiche le montant payé
- Le statut change (Non payé → Partiellement payé)
- L'historique montre le paiement

### Dans MySQL
```sql
SELECT * FROM stock_management.payments 
ORDER BY id DESC LIMIT 5;
```

**Résultat attendu:** Vous voyez votre paiement de test.

---

## 🎉 C'EST FAIT!

Votre système de paiements fonctionne maintenant avec MySQL local!

### Fonctionnalités disponibles:
- ✅ Enregistrer des paiements
- ✅ Voir l'historique
- ✅ Calculer les soldes
- ✅ Dashboard des impayés
- ✅ Modifier/Supprimer des paiements

---

## 🔄 BASCULER ENTRE SUPABASE ET MYSQL

Vous pouvez basculer à tout moment:

1. Aller dans **Paramètres** > **Configuration Base de Données**
2. Sélectionner **Supabase** ou **MySQL Local**
3. Cliquer **Activer cette base**

Les paiements sont stockés séparément dans chaque base.

---

## 📞 BESOIN D'AIDE?

Consultez: `MIGRATION_MYSQL_PAYMENTS_COMPLETE.md`

Section dépannage pour les problèmes courants.
