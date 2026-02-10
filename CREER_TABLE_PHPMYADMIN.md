# 📋 Créer la table payments via phpMyAdmin

## 🎯 Étapes simples

### 1. Ouvrir phpMyAdmin

http://localhost/phpmyadmin

### 2. Sélectionner la base

Dans le menu de gauche, cliquez sur **`stock_management`**

### 3. Aller dans l'onglet SQL

En haut de la page, cliquez sur l'onglet **"SQL"**

### 4. Copier-Coller ce code

```sql
-- Créer la table payments
CREATE TABLE payments (
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
```

### 5. Cliquer sur "Exécuter"

Bouton en bas à droite : **"Exécuter"** ou **"Go"**

### 6. Vérifier

Vous devriez voir un message de succès en vert.

Dans le menu de gauche, sous `stock_management`, vous devriez maintenant voir la table **`payments`**.

---

## ✅ Vérification rapide

Cliquez sur la table `payments` dans le menu de gauche.

Vous devriez voir la structure avec toutes les colonnes :
- id
- tenant_id
- document_type
- document_id
- payment_date
- amount
- payment_method
- notes
- created_at
- created_by
- updated_at
- updated_by

---

## 🎉 C'est fait !

Une fois la table créée, exécutez :

```cmd
node test-mysql-payments.js
```

Pour vérifier que tout fonctionne !
