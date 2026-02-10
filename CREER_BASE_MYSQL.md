# 🚀 Créer la base stock_management dans MySQL

## ⚡ Méthode 1 : Copier-Coller (2 minutes)

### Étape 1 : Ouvrir MySQL

```cmd
mysql -h localhost -P 3307 -u root
```

Si MySQL n'est pas dans le PATH, utilisez le chemin complet :
```cmd
"C:\wamp64\bin\mysql\mysql8.0.x\bin\mysql.exe" -h localhost -P 3307 -u root
```

Ou via WAMP :
- Cliquez sur l'icône WAMP
- MySQL → MySQL Console

### Étape 2 : Copier-Coller ce code

```sql
-- Créer la base
CREATE DATABASE IF NOT EXISTS stock_management 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Utiliser la base
USE stock_management;

-- Créer la table payments
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    document_type VARCHAR(20) NOT NULL,
    document_id BIGINT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT,
    
    INDEX idx_tenant_document (tenant_id, document_type, document_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_tenant_id (tenant_id),
    
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_document_type CHECK (document_type IN ('delivery_note', 'invoice'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vérifier
SHOW TABLES;
DESCRIBE payments;
```

### Étape 3 : Vérifier

```sql
SELECT 'Base créée avec succès!' AS message;
```

---

## ⚡ Méthode 2 : Via phpMyAdmin (1 minute)

### Étape 1 : Ouvrir phpMyAdmin

- Via WAMP : http://localhost/phpmyadmin
- Ou cliquez sur l'icône WAMP → phpMyAdmin

### Étape 2 : Créer la base

1. Cliquez sur **"Nouvelle base de données"**
2. Nom : `stock_management`
3. Interclassement : `utf8mb4_unicode_ci`
4. Cliquez **"Créer"**

### Étape 3 : Créer la table

1. Sélectionnez `stock_management` dans le menu de gauche
2. Cliquez sur l'onglet **"SQL"**
3. Copiez-collez le code de la table (voir ci-dessus)
4. Cliquez **"Exécuter"**

---

## ⚡ Méthode 3 : Via MySQL Workbench

### Étape 1 : Ouvrir MySQL Workbench

### Étape 2 : Se connecter

- Host: localhost
- Port: 3307
- User: root

### Étape 3 : Exécuter le script

1. Ouvrir le fichier `setup-mysql-local.sql`
2. Cliquer sur l'éclair ⚡ (Execute)

---

## ✅ Vérification

Une fois créée, vérifiez :

```sql
-- Voir toutes les bases
SHOW DATABASES;

-- Utiliser la base
USE stock_management;

-- Voir les tables
SHOW TABLES;

-- Voir la structure
DESCRIBE payments;
```

Vous devriez voir :
```
+----------------+---------------+------+-----+-------------------+
| Field          | Type          | Null | Key | Default           |
+----------------+---------------+------+-----+-------------------+
| id             | bigint        | NO   | PRI | NULL              |
| tenant_id      | varchar(50)   | NO   | MUL | NULL              |
| document_type  | varchar(20)   | NO   |     | NULL              |
| document_id    | bigint        | NO   |     | NULL              |
| payment_date   | date          | NO   | MUL | NULL              |
| amount         | decimal(15,2) | NO   |     | NULL              |
| ...            | ...           | ...  | ... | ...               |
+----------------+---------------+------+-----+-------------------+
```

---

## 🎯 Ensuite

Une fois la base créée, configurez `backend/.env` :

```env
MYSQL_HOST=localhost
MYSQL_PORT=3307
MYSQL_DATABASE=stock_management
MYSQL_USER=root
MYSQL_PASSWORD=
```

Et votre application utilisera MySQL local pour les paiements !

---

## 🐛 Problèmes ?

### "mysql: command not found"

MySQL n'est pas dans le PATH. Utilisez :
- phpMyAdmin (plus simple)
- MySQL Workbench
- Ou le chemin complet vers mysql.exe

### "Access denied"

Vérifiez le mot de passe root de MySQL.

### "Database exists"

Parfait ! La base existe déjà. Passez directement à la création de la table.

---

Quelle méthode voulez-vous utiliser ?
