/**
 * MIGRATION COMPLÈTE: Supabase → MySQL
 * 
 * Ce script migre TOUS les paiements de Supabase vers MySQL
 * pour avoir une seule source de vérité.
 */

const mysql = require('mysql2/promise');
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const SUPABASE_URL = 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

// Configuration MySQL
const MYSQL_CONFIG = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: '',
  database: 'stock_management'
};

async function migratePayments() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   MIGRATION SUPABASE → MYSQL                           ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  let mysqlConnection;
  
  try {
    // 1. Connexion à Supabase
    console.log('1️⃣  Connexion à Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('   ✅ Connecté à Supabase\n');

    // 2. Récupérer tous les paiements de Supabase
    console.log('2️⃣  Récupération des paiements depuis Supabase...');
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      throw new Error(`Erreur Supabase: ${error.message}`);
    }

    console.log(`   ✅ ${payments.length} paiements trouvés\n`);

    if (payments.length === 0) {
      console.log('   ℹ️  Aucun paiement à migrer');
      return;
    }

    // Afficher les paiements
    console.log('   Paiements à migrer:');
    payments.forEach(p => {
      console.log(`   - ID: ${p.id} | Tenant: ${p.tenant_id} | Doc: ${p.document_type}/${p.document_id} | Montant: ${p.amount} DA | Date: ${p.payment_date}`);
    });
    console.log('');

    // 3. Connexion à MySQL
    console.log('3️⃣  Connexion à MySQL...');
    mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('   ✅ Connecté à MySQL\n');

    // 4. Vérifier si des paiements existent déjà dans MySQL
    console.log('4️⃣  Vérification des paiements existants dans MySQL...');
    const [existingPayments] = await mysqlConnection.execute(
      'SELECT COUNT(*) as count FROM payments'
    );
    const existingCount = existingPayments[0].count;
    console.log(`   ℹ️  ${existingCount} paiements déjà dans MySQL\n`);

    if (existingCount > 0) {
      console.log('   ⚠️  ATTENTION: Des paiements existent déjà dans MySQL!');
      console.log('   Options:');
      console.log('   1. Supprimer les paiements MySQL existants et migrer');
      console.log('   2. Annuler la migration');
      console.log('');
      console.log('   Pour continuer, modifiez le script et décommentez la ligne de suppression.');
      console.log('');
      
      // Décommenter cette ligne pour supprimer les paiements existants:
      // await mysqlConnection.execute('DELETE FROM payments');
      // console.log('   ✅ Paiements MySQL existants supprimés\n');
      
      return;
    }

    // 5. Migrer les paiements
    console.log('5️⃣  Migration des paiements vers MySQL...');
    let migratedCount = 0;
    let errorCount = 0;

    for (const payment of payments) {
      try {
        await mysqlConnection.execute(
          `INSERT INTO payments 
            (tenant_id, document_type, document_id, payment_date, amount, payment_method, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            payment.tenant_id,
            payment.document_type,
            payment.document_id,
            payment.payment_date,
            payment.amount,
            payment.payment_method,
            payment.notes,
            payment.created_at,
            payment.updated_at
          ]
        );
        migratedCount++;
        console.log(`   ✅ Migré: ID ${payment.id} → MySQL`);
      } catch (err) {
        errorCount++;
        console.log(`   ❌ Erreur: ID ${payment.id} - ${err.message}`);
      }
    }

    console.log('');
    console.log(`   📊 Résultat: ${migratedCount} migrés, ${errorCount} erreurs\n`);

    // 6. Vérification finale
    console.log('6️⃣  Vérification finale...');
    const [finalCount] = await mysqlConnection.execute(
      'SELECT COUNT(*) as count FROM payments'
    );
    console.log(`   ✅ Total dans MySQL: ${finalCount[0].count} paiements\n`);

    // 7. Résumé
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   MIGRATION TERMINÉE                                   ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log(`✅ ${migratedCount} paiements migrés avec succès`);
    console.log(`✅ MySQL contient maintenant ${finalCount[0].count} paiements`);
    console.log('');
    console.log('🎯 PROCHAINES ÉTAPES:');
    console.log('1. Activer MySQL dans l\'interface (Paramètres → Config DB)');
    console.log('2. Vérifier que tous les paiements sont visibles');
    console.log('3. NE PLUS UTILISER Supabase pour les paiements');
    console.log('');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log('🔌 Connexion MySQL fermée\n');
    }
  }
}

// Exécuter la migration
migratePayments();
