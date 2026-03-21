-- =====================================================
-- RETOUR EN STOCK — Tables avoir + detail_avoir
-- Script MySQL
-- =====================================================

CREATE TABLE IF NOT EXISTS avoir (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nclient VARCHAR(10) NOT NULL,
  date_avoir DATE NOT NULL,
  document_type VARCHAR(20) NOT NULL,
  document_ref INT NOT NULL,
  montant_ht DECIMAL(15,2) NOT NULL DEFAULT 0,
  tva DECIMAL(15,2) NOT NULL DEFAULT 0,
  montant_ttc DECIMAL(15,2) NOT NULL DEFAULT 0,
  motif TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_avoir_nclient (nclient),
  INDEX idx_avoir_document (document_type, document_ref)
);

CREATE TABLE IF NOT EXISTS detail_avoir (
  id INT AUTO_INCREMENT PRIMARY KEY,
  avoir_id INT NOT NULL,
  narticle VARCHAR(10) NOT NULL,
  qte DECIMAL(15,2) NOT NULL,
  prix DECIMAL(15,2) NOT NULL,
  tva DECIMAL(5,2) NOT NULL DEFAULT 19,
  total_ligne DECIMAL(15,2) NOT NULL,
  INDEX idx_detail_avoir_id (avoir_id),
  FOREIGN KEY (avoir_id) REFERENCES avoir(id) ON DELETE CASCADE
);

SHOW TABLES LIKE 'avoir';
SHOW TABLES LIKE 'detail_avoir';
