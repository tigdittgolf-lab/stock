# 🔍 Comment trouver la base de données MySQL ?

## ⚡ Méthode rapide (2 minutes)

### Option 1 : Ligne de commande

Ouvrez un terminal et tapez :

```cmd
mysql -h localhost -P 3307 -u root
```

Puis dans MySQL :

```sql
SHOW DATABASES;
```

**Vous verrez toutes vos bases de données !**

---

### Option 2 : Script automatique

**Windows PowerShell :**
```powershell
.\check-mysql.ps1
```

**Windows CMD :**
```cmd
check-mysql.bat
```

---

## 📊 Que chercher ?

### Bases possibles :

1. **stock_management** ← Base pour les paiements
2. **2025_bu01, 2024_bu01, etc.** ← Bases tenant
3. **Autre nom avec "stock" ou "bu"**

---

## 🎯 Une fois trouvée

### Si vous trouvez `stock_management` :

```sql
USE stock_management;
SHOW TABLES;
```

Cherchez la table `payments`.

**Si elle existe :**
```sql
SELECT * FROM payments LIMIT 5;
```

**Si elle n'existe pas :**
```sql
SOURCE backend/migrations/create_payments_table_mysql.sql;
```

---

### Si vous ne trouvez PAS `stock_management` :

**Option A : La créer**
```sql
CREATE DATABASE stock_management 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE stock_management;
SOURCE backend/migrations/create_payments_table_mysql.sql;
```

**Option B : Utiliser une base existante**

Si vous avez `2025_bu01` :
```sql
USE 2025_bu01;
SOURCE backend/migrations/create_payments_table_mysql.sql;
```

Puis mettez à jour `backend/.env` :
```env
MYSQL_DATABASE=2025_bu01
```

---

## 🐛 Problèmes ?

### "mysql: command not found"

MySQL n'est pas dans le PATH.

**Solutions :**
1. Utiliser MySQL Workbench (interface graphique)
2. Utiliser phpMyAdmin
3. Ajouter MySQL au PATH

### "Access denied"

Mauvais mot de passe.

**Solution :**
```cmd
mysql -h localhost -P 3307 -u root -p
```
(Il demandera le mot de passe)

### "Can't connect"

MySQL n'est pas démarré ou mauvais port.

**Solutions :**
1. Démarrer MySQL
2. Essayer le port 3306 au lieu de 3307
3. Vérifier dans les services Windows

---

## 📞 Dites-moi

Exécutez `SHOW DATABASES;` et dites-moi ce que vous voyez !

Je vous aiderai à configurer correctement. 🚀

---

## 📚 Plus d'infos

Consultez **GUIDE_VERIFICATION_MYSQL.md** pour un guide complet.
