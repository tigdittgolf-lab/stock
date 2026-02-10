-- Migration des paiements de stock_management vers 2025_bu01

USE 2025_bu01;

-- 1. Créer la table payments si elle n'existe pas
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(50) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  document_id INT NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT,
  INDEX idx_document (tenant_id, document_type, document_id),
  INDEX idx_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Copier les paiements depuis stock_management
INSERT INTO 2025_bu01.payments 
  (tenant_id, document_type, document_id, payment_date, amount, payment_method, notes, created_at, created_by, updated_at, updated_by)
SELECT 
  tenant_id, document_type, document_id, payment_date, amount, payment_method, notes, created_at, created_by, updated_at, updated_by
FROM stock_management.payments
WHERE NOT EXISTS (
  SELECT 1 FROM 2025_bu01.payments p2 
  WHERE p2.tenant_id = stock_management.payments.tenant_id 
    AND p2.document_id = stock_management.payments.document_id
    AND p2.payment_date = stock_management.payments.payment_date
    AND p2.amount = stock_management.payments.amount
);

-- 3. Vérifier
SELECT COUNT(*) as total_payments FROM payments;
SELECT * FROM payments ORDER BY id DESC LIMIT 5;
