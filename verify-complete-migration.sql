-- Vérification complète de la migration avec toutes les tables
\echo '=== VERIFICATION COMPLETE DE LA MIGRATION ==='

\echo '=== SCHEMAS CREES ==='
\dn

\echo '=== TOUTES LES TABLES DANS 2025_bu01 ==='
\dt "2025_bu01".*

\echo '=== TOUTES LES TABLES DANS 2026_bu01 ==='
\dt "2026_bu01".*

\echo '=== DONNEES ARTICLES ==='
SELECT 'SCHEMA 2025_bu01' as schema, COUNT(*) as total FROM "2025_bu01".article
UNION ALL
SELECT 'SCHEMA 2026_bu01' as schema, COUNT(*) as total FROM "2026_bu01".article;

\echo '=== DONNEES CLIENTS ==='
SELECT 'SCHEMA 2025_bu01' as schema, COUNT(*) as total FROM "2025_bu01".client
UNION ALL
SELECT 'SCHEMA 2026_bu01' as schema, COUNT(*) as total FROM "2026_bu01".client;

\echo '=== DONNEES FAMILLE_ART ==='
SELECT 'SCHEMA 2025_bu01' as schema, COUNT(*) as total FROM "2025_bu01".famille_art
UNION ALL
SELECT 'SCHEMA 2026_bu01' as schema, COUNT(*) as total FROM "2026_bu01".famille_art;

\echo '=== DONNEES PROFORMA ==='
SELECT 'SCHEMA 2025_bu01' as schema, COUNT(*) as total FROM "2025_bu01".proforma
UNION ALL
SELECT 'SCHEMA 2026_bu01' as schema, COUNT(*) as total FROM "2026_bu01".proforma;

\echo '=== DONNEES FOURNISSEUR ==='
SELECT 'SCHEMA 2025_bu01' as schema, COUNT(*) as total FROM "2025_bu01".fournisseur
UNION ALL
SELECT 'SCHEMA 2026_bu01' as schema, COUNT(*) as total FROM "2026_bu01".fournisseur;

\echo '=== DONNEES ACTIVITE ==='
SELECT 'SCHEMA 2025_bu01' as schema, COUNT(*) as total FROM "2025_bu01".activite
UNION ALL
SELECT 'SCHEMA 2026_bu01' as schema, COUNT(*) as total FROM "2026_bu01".activite;

\echo '=== DONNEES BL ==='
SELECT 'SCHEMA 2025_bu01' as schema, COUNT(*) as total FROM "2025_bu01".bl
UNION ALL
SELECT 'SCHEMA 2026_bu01' as schema, COUNT(*) as total FROM "2026_bu01".bl;

\echo '=== DONNEES FACTURE ==='
SELECT 'SCHEMA 2025_bu01' as schema, COUNT(*) as total FROM "2025_bu01".facture
UNION ALL
SELECT 'SCHEMA 2026_bu01' as schema, COUNT(*) as total FROM "2026_bu01".facture;

\echo '=== DONNEES DETAIL_BL ==='
SELECT 'SCHEMA 2025_bu01' as schema, COUNT(*) as total FROM "2025_bu01".detail_bl
UNION ALL
SELECT 'SCHEMA 2026_bu01' as schema, COUNT(*) as total FROM "2026_bu01".detail_bl;

\echo '=== DONNEES DETAIL_FACT ==='
SELECT 'SCHEMA 2025_bu01' as schema, COUNT(*) as total FROM "2025_bu01".detail_fact
UNION ALL
SELECT 'SCHEMA 2026_bu01' as schema, COUNT(*) as total FROM "2026_bu01".detail_fact;

\echo '=== DONNEES DETAIL_PROFORMA ==='
SELECT 'SCHEMA 2025_bu01' as schema, COUNT(*) as total FROM "2025_bu01".detail_proforma
UNION ALL
SELECT 'SCHEMA 2026_bu01' as schema, COUNT(*) as total FROM "2026_bu01".detail_proforma;

\echo '=== ECHANTILLON FAMILLE_ART 2025_bu01 ==='
SELECT * FROM "2025_bu01".famille_art LIMIT 5;

\echo '=== ECHANTILLON ARTICLES 2025_bu01 ==='
SELECT narticle, designation, prix_vente, stock_f FROM "2025_bu01".article LIMIT 3;

\echo '=== ECHANTILLON CLIENTS 2025_bu01 ==='
SELECT nclient, raison_sociale, tel FROM "2025_bu01".client LIMIT 3;