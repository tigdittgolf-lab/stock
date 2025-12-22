-- Vérification des données migrées
\echo '=== VERIFICATION DES SCHEMAS ==='
\dn

\echo '=== VERIFICATION DES TABLES 2025_bu01 ==='
\dt "2025_bu01".*

\echo '=== VERIFICATION DES DONNEES ARTICLES 2025_bu01 ==='
SELECT COUNT(*) as total_articles FROM "2025_bu01".article;
SELECT narticle, designation, prix_vente FROM "2025_bu01".article LIMIT 5;

\echo '=== VERIFICATION DES DONNEES CLIENTS 2025_bu01 ==='
SELECT COUNT(*) as total_clients FROM "2025_bu01".client;
SELECT nclient, raison_sociale FROM "2025_bu01".client LIMIT 5;

\echo '=== VERIFICATION DES DONNEES PROFORMA 2025_bu01 ==='
SELECT COUNT(*) as total_proforma FROM "2025_bu01".proforma;
SELECT nfact, nclient, montant_ttc FROM "2025_bu01".proforma LIMIT 5;

\echo '=== VERIFICATION DES DONNEES ARTICLES 2026_bu01 ==='
SELECT COUNT(*) as total_articles FROM "2026_bu01".article;
SELECT narticle, designation, prix_vente FROM "2026_bu01".article LIMIT 5;

\echo '=== VERIFICATION DES DONNEES CLIENTS 2026_bu01 ==='
SELECT COUNT(*) as total_clients FROM "2026_bu01".client;
SELECT nclient, raison_sociale FROM "2026_bu01".client LIMIT 5;