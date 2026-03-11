// Script pour vérifier si la table payments existe et contient des données
const mysql = require('mysql2/promise');

async function checkPaymentsTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: '2009_bu02'
  });

  try {
    console.log('✅ Connecté à MySQL database: 2009_bu02\n');

    // Vérifier si la table payments existe
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = '2009_bu02' AND TABLE_NAME = 'payments'
    `);

    if (tables.length === 0) {
      console.log('❌ La table payments N\'EXISTE PAS dans 2009_bu02');
      console.log('📝 Vous devez créer la table avec:');
      console.log('   mysql -u root -p 2009_bu02 < backend/migrations/create_payments_table_mysql.sql');
    } else {
      console.log('✅ La table payments existe\n');

      // Compter les paiements
      const [countResult] = await connection.query('SELECT COUNT(*) as count FROM payments');
      const count = countResult[0].count;
      console.log(`📊 Nombre de paiements dans la table: ${count}\n`);

      if (count > 0) {
        // Afficher quelques exemples
        const [payments] = await connection.query(`
          SELECT 
            id, 
            document_type, 
            document_id, 
            amount, 
            payment_date,
            payment_method
          FROM payments 
          LIMIT 5
        `);
        console.log('📋 Exemples de paiements:');
        console.table(payments);

        // Statistiques par type de document
        const [stats] = await connection.query(`
          SELECT 
            document_type,
            COUNT(*) as count,
            SUM(amount) as total_amount
          FROM payments
          GROUP BY document_type
        `);
        console.log('\n📊 Statistiques par type de document:');
        console.table(stats);
      } else {
        console.log('⚠️ La table payments existe mais est VIDE');
        console.log('💡 Cela explique pourquoi tous les BLs sont marqués comme "paid"');
        console.log('   (aucun paiement trouvé = considéré comme payé par défaut)');
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await connection.end();
  }
}

checkPaymentsTable();
