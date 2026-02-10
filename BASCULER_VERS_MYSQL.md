# 🔄 BASCULER VERS MYSQL - GUIDE RAPIDE

**Actuellement:** Vous utilisez **Supabase** (cloud)  
**Objectif:** Basculer vers **MySQL** (local)

---

## 📊 SITUATION ACTUELLE

Vous voyez 2 paiements dans l'interface:
- 9 février 2026: 65.17 DA (Espèces)
- 8 février 2026: 4000.00 DA (Paiement mobile)

**Ces paiements sont dans Supabase, pas dans MySQL.**

---

## 🎯 ÉTAPES POUR BASCULER VERS MYSQL

### Étape 1: Ouvrir les paramètres (10 secondes)
1. Dans l'application (http://localhost:3000)
2. Cliquer sur l'icône **⚙️ Paramètres** (en haut à droite)
3. Cliquer sur **"Configuration Base de Données"**

### Étape 2: Sélectionner MySQL (30 secondes)
1. Dans la liste, cliquer sur **"MySQL Local"**
2. Remplir les informations:
   ```
   Nom:      MySQL Local
   Host:     localhost
   Port:     3307
   Database: stock_management
   User:     root
   Password: (laisser vide)
   ```

### Étape 3: Tester et activer (10 secondes)
1. Cliquer sur **"Tester la connexion"**
   - Résultat attendu: ✅ "Connexion réussie"
2. Cliquer sur **"Activer cette base"**
   - L'indicateur en haut devrait changer: ☁️ Supabase → 🐬 MySQL

### Étape 4: Vérifier (5 secondes)
- Regardez l'indicateur en haut de la page
- Il devrait afficher: **🐬 MySQL (Local)**
- Rafraîchissez la page du BL

---

## 🔍 APRÈS LE BASCULEMENT

### Ce qui va se passer:
1. ✅ L'indicateur affiche "🐬 MySQL"
2. ✅ Les nouveaux paiements iront dans MySQL
3. ⚠️ Les anciens paiements (Supabase) ne seront plus visibles
4. ✅ La table MySQL est vide (pour l'instant)

### Vérifier dans MySQL:
```powershell
&"C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe" -u root -P 3307 -e "SELECT * FROM stock_management.payments;"
```

**Résultat attendu:** Table vide (0 lignes)

---

## 💡 COMPRENDRE LA SÉPARATION

### Supabase (Cloud)
- 📍 Localisation: Cloud (internet)
- 💾 Données: 2 paiements existants
- 🔄 Accès: Quand Supabase est activé

### MySQL (Local)
- 📍 Localisation: Votre ordinateur (WAMP)
- 💾 Données: Vide (pour l'instant)
- 🔄 Accès: Quand MySQL est activé

**Les deux bases sont indépendantes!**

---

## 🧪 TESTER AVEC MYSQL

### Créer un paiement de test:
1. Assurez-vous que MySQL est activé (🐬 MySQL)
2. Sur le BL N°3, cliquer **"💰 Enregistrer un paiement"**
3. Remplir:
   ```
   Date:    (aujourd'hui)
   Montant: 1000
   Mode:    Espèces
   Notes:   Test MySQL
   ```
4. Cliquer **"Enregistrer"**

### Vérifier:
```powershell
&"C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe" -u root -P 3307 -e "SELECT * FROM stock_management.payments;"
```

**Résultat attendu:** 1 ligne avec votre paiement de test

---

## 🔄 BASCULER ENTRE LES DEUX

Vous pouvez basculer à tout moment:

### Vers Supabase:
1. Paramètres → Configuration Base de Données
2. Sélectionner "Supabase Production"
3. Activer
4. → Vous verrez les 2 anciens paiements

### Vers MySQL:
1. Paramètres → Configuration Base de Données
2. Sélectionner "MySQL Local"
3. Activer
4. → Vous verrez les paiements MySQL

---

## 📊 MIGRATION DES DONNÉES (Optionnel)

Si vous voulez copier les 2 paiements de Supabase vers MySQL:

### Option 1: Manuellement
1. Activer Supabase
2. Noter les détails des 2 paiements
3. Activer MySQL
4. Recréer les 2 paiements manuellement

### Option 2: Via SQL
```sql
-- Insérer les paiements dans MySQL
INSERT INTO stock_management.payments 
  (tenant_id, document_type, document_id, payment_date, amount, payment_method, notes)
VALUES
  ('2025_bu01', 'delivery_note', 3, '2026-02-08', 4000.00, 'Paiement mobile', 'note 2 paiement'),
  ('2025_bu01', 'delivery_note', 3, '2026-02-09', 65.17, 'Espèces', 'note 2 payment');
```

Exécuter:
```powershell
&"C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe" -u root -P 3307 stock_management -e "INSERT INTO payments (tenant_id, document_type, document_id, payment_date, amount, payment_method, notes) VALUES ('2025_bu01', 'delivery_note', 3, '2026-02-08', 4000.00, 'Paiement mobile', 'note 2 paiement'), ('2025_bu01', 'delivery_note', 3, '2026-02-09', 65.17, 'Espèces', 'note 2 payment');"
```

---

## ✅ RÉSUMÉ

| Aspect | Supabase | MySQL |
|--------|----------|-------|
| Localisation | ☁️ Cloud | 💻 Local |
| Paiements actuels | 2 | 0 |
| Accès | Internet requis | Pas d'internet |
| Performance | ~200ms | ~50ms |
| Coût | Payant (cloud) | Gratuit |

---

## 🎯 RECOMMANDATION

**Pour tester MySQL:**
1. Basculer vers MySQL (étapes ci-dessus)
2. Créer un paiement de test
3. Vérifier dans MySQL
4. Comparer les performances

**Pour la production:**
- Choisir une base principale (Supabase OU MySQL)
- Migrer toutes les données vers cette base
- Utiliser l'autre comme backup

---

## 📞 BESOIN D'AIDE?

**Problème de connexion MySQL?**
- Vérifier que WAMP est démarré
- Vérifier le port 3307
- Consulter: `MIGRATION_MYSQL_PAYMENTS_COMPLETE.md` (section Dépannage)

**Questions?**
- Voir: `COMMENCER_MAINTENANT.md`
- Ou: `README_MIGRATION_MYSQL.md`

---

**Prêt à basculer? Suivez les étapes ci-dessus! 🚀**
