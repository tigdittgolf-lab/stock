// Vérifier où se trouve la table payments
import mysql from 'mysql2/promise';

async function checkPaymentsLocation() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: ''
  });

  try {
    // Chercher la table payments
    const [tables] = await connection.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_NAME = 'payments'
    `);

    console.log('📊 Tables "payments" trouvées:');
    console.table(tables);

    // Vérifier le contenu de stock_management.payments
    if (tables.some(t => t.TABLE_SCHEMA === 'stock_management')) {
      const [count] = await connection.query('SELECT COUNT(*) as count FROM stock_management.payments');
      console.log(`\n✅ stock_management.payments contient ${count[0].count} paiements`);
      
      if (count[0].count > 0) {
        const [sample] = await connection.query('SELECT * FROM stock_management.payments LIMIT 3');
        console.log('\n📋 Exemples de paiements:');
        console.table(sample);
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await connection.end();
  }
}

checkPaymentsLocation();
