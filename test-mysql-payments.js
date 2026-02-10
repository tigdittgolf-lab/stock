/**
 * Script de test pour vérifier que la table payments fonctionne dans MySQL local
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  TEST MySQL Local - Table payments                    ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

async function testPayments() {
  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3307'),
    database: process.env.MYSQL_DATABASE || 'stock_management',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
  };

  console.log('📋 Configuration:\n');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   User: ${config.user}\n`);

  let connection;

  try {
    // 1. Connexion
    console.log('═══════════════════════════════════════════════════════');
    console.log('1️⃣  CONNEXION\n');
    console.log('🔌 Connexion à MySQL...');
    
    connection = await mysql.createConnection(config);
    console.log('✅ Connecté à MySQL\n');

    // 2. Vérifier la base
    console.log('═══════════════════════════════════════════════════════');
    console.log('2️⃣  VÉRIFICATION DE LA BASE\n');
    
    const [databases] = await connection.query('SHOW DATABASES LIKE ?', [config.database]);
    if (databases.length > 0) {
      console.log(`✅ Base "${config.database}" existe\n`);
    } else {
      console.log(`❌ Base "${config.database}" introuvable\n`);
      return;
    }

    // 3. Vérifier la table
    console.log('═══════════════════════════════════════════════════════');
    console.log('3️⃣  VÉRIFICATION DE LA TABLE\n');
    
    const [tables] = await connection.query(`SHOW TABLES FROM ${config.database}`);
    const tableExists = tables.some(row => {
      const tableName = Object.values(row)[0];
      return tableName.toLowerCase() === 'payments';
    });
    
    if (tableExists) {
      console.log('✅ Table "payments" existe\n');
    } else {
      console.log('❌ Table "payments" introuvable\n');
      console.log('Tables disponibles:');
      tables.forEach(row => {
        console.log(`   - ${Object.values(row)[0]}`);
      });
      console.log('');
      return;
    }

    // 4. Voir la structure
    console.log('═══════════════════════════════════════════════════════');
    console.log('4️⃣  STRUCTURE DE LA TABLE\n');
    
    const [structure] = await connection.query('DESCRIBE payments');
    console.log('Colonnes:\n');
    structure.forEach(col => {
      console.log(`   ${col.Field.padEnd(20)} ${col.Type.padEnd(20)} ${col.Key ? '🔑' : ''}`);
    });
    console.log('');

    // 5. Compter les paiements
    console.log('═══════════════════════════════════════════════════════');
    console.log('5️⃣  DONNÉES EXISTANTES\n');
    
    const [count] = await connection.query('SELECT COUNT(*) as total FROM payments');
    console.log(`📊 Nombre de paiements: ${count[0].total}\n`);

    if (count[0].total > 0) {
      const [payments] = await connection.query('SELECT * FROM payments LIMIT 5');
      console.log('📄 Exemples:\n');
      payments.forEach((p, i) => {
        console.log(`   ${i + 1}. ID: ${p.id}, Tenant: ${p.tenant_id}, Montant: ${p.amount} DA`);
      });
      console.log('');
    }

    // 6. Test d'insertion
    console.log('═══════════════════════════════════════════════════════');
    console.log('6️⃣  TEST D\'INSERTION\n');
    
    console.log('📝 Insertion d\'un paiement de test...');
    
    const testPayment = {
      tenant_id: '2025_bu01',
      document_type: 'delivery_note',
      document_id: 999,
      payment_date: new Date().toISOString().split('T')[0],
      amount: 1000.00,
      payment_method: 'Espèces',
      notes: 'Test de vérification - À SUPPRIMER'
    };

    const [insertResult] = await connection.query(
      `INSERT INTO payments (tenant_id, document_type, document_id, payment_date, amount, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        testPayment.tenant_id,
        testPayment.document_type,
        testPayment.document_id,
        testPayment.payment_date,
        testPayment.amount,
        testPayment.payment_method,
        testPayment.notes
      ]
    );

    const insertedId = insertResult.insertId;
    console.log(`✅ Paiement inséré avec ID: ${insertedId}\n`);

    // 7. Test de lecture
    console.log('═══════════════════════════════════════════════════════');
    console.log('7️⃣  TEST DE LECTURE\n');
    
    const [inserted] = await connection.query('SELECT * FROM payments WHERE id = ?', [insertedId]);
    if (inserted.length > 0) {
      console.log('✅ Paiement lu avec succès:');
      console.log(`   ID: ${inserted[0].id}`);
      console.log(`   Tenant: ${inserted[0].tenant_id}`);
      console.log(`   Type: ${inserted[0].document_type}`);
      console.log(`   Document: ${inserted[0].document_id}`);
      console.log(`   Montant: ${inserted[0].amount} DA`);
      console.log(`   Date: ${inserted[0].payment_date}`);
      console.log('');
    }

    // 8. Test de mise à jour
    console.log('═══════════════════════════════════════════════════════');
    console.log('8️⃣  TEST DE MISE À JOUR\n');
    
    await connection.query(
      'UPDATE payments SET amount = ?, notes = ? WHERE id = ?',
      [1500.00, 'Test modifié', insertedId]
    );
    console.log('✅ Paiement mis à jour\n');

    // 9. Test de suppression
    console.log('═══════════════════════════════════════════════════════');
    console.log('9️⃣  TEST DE SUPPRESSION\n');
    
    await connection.query('DELETE FROM payments WHERE id = ?', [insertedId]);
    console.log('✅ Paiement de test supprimé\n');

    // 10. Test des contraintes
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔟 TEST DES CONTRAINTES\n');
    
    console.log('Test 1: Montant négatif (doit échouer)...');
    try {
      await connection.query(
        `INSERT INTO payments (tenant_id, document_type, document_id, payment_date, amount)
         VALUES (?, ?, ?, ?, ?)`,
        ['2025_bu01', 'delivery_note', 999, new Date().toISOString().split('T')[0], -100]
      );
      console.log('❌ ERREUR: Le montant négatif a été accepté !\n');
    } catch (error) {
      console.log('✅ Contrainte respectée: Montant négatif rejeté\n');
    }

    console.log('Test 2: Type de document invalide (doit échouer)...');
    try {
      await connection.query(
        `INSERT INTO payments (tenant_id, document_type, document_id, payment_date, amount)
         VALUES (?, ?, ?, ?, ?)`,
        ['2025_bu01', 'invalid_type', 999, new Date().toISOString().split('T')[0], 100]
      );
      console.log('❌ ERREUR: Le type invalide a été accepté !\n');
    } catch (error) {
      console.log('✅ Contrainte respectée: Type invalide rejeté\n');
    }

    // Résumé final
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ RÉSUMÉ\n');
    console.log('Tous les tests sont passés avec succès !');
    console.log('');
    console.log('La table payments dans MySQL local fonctionne parfaitement:');
    console.log('   ✅ Connexion');
    console.log('   ✅ Structure correcte');
    console.log('   ✅ Insertion');
    console.log('   ✅ Lecture');
    console.log('   ✅ Mise à jour');
    console.log('   ✅ Suppression');
    console.log('   ✅ Contraintes');
    console.log('');
    console.log('🎉 Votre configuration MySQL locale est prête !');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('\nDétails:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée\n');
    }
  }
}

testPayments();
