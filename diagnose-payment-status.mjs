// Script pour diagnostiquer le calcul des statuts de paiement
import mysql from 'mysql2/promise';

async function diagnose() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: '2009_bu02'
  });

  try {
    console.log('🔍 DIAGNOSTIC DES STATUTS DE PAIEMENT\n');

    // 1. Récupérer quelques BLs avec leurs montants
    const [bls] = await connection.query(`
      SELECT NFact as nbl, montant_ht, tva, 
             CAST(montant_ht AS DECIMAL(15,2)) + CAST(tva AS DECIMAL(15,2)) as montant_ttc_calculated
      FROM bl 
      ORDER BY NFact DESC 
      LIMIT 10
    `);

    console.log('📋 Exemples de BLs avec montants:');
    console.table(bls);

    // 2. Récupérer les paiements pour ces BLs
    const blIds = bls.map(bl => bl.nbl).join(',');
    
    const [payments] = await connection.query(`
      SELECT document_id, amount, payment_date, payment_method
      FROM stock_management.payments
      WHERE tenant_id = '2009_bu02' 
        AND document_type = 'delivery_note'
        AND document_id IN (${blIds})
      ORDER BY document_id, payment_date
    `);

    console.log('\n💰 Paiements pour ces BLs:');
    if (payments.length > 0) {
      console.table(payments);
    } else {
      console.log('❌ AUCUN paiement trouvé pour ces BLs');
    }

    // 3. Calculer les statuts comme le fait le backend
    console.log('\n📊 CALCUL DES STATUTS (logique backend):');
    
    for (const bl of bls) {
      const blPayments = payments.filter(p => p.document_id === bl.nbl);
      const totalPaid = blPayments.reduce((sum, p) => {
        const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount;
        return sum + amount;
      }, 0);
      
      const totalAmount = parseFloat(bl.montant_ttc_calculated);
      const balance = totalAmount - totalPaid;
      
      let status = 'unpaid';
      if (Math.abs(balance) < 0.01) {
        status = 'paid';
      } else if (totalPaid > 0 && balance > 0) {
        status = 'partially_paid';
      }
      
      console.log(`\nBL ${bl.nbl}:`);
      console.log(`  Montant TTC: ${totalAmount.toFixed(2)} DA`);
      console.log(`  Total payé: ${totalPaid.toFixed(2)} DA`);
      console.log(`  Balance: ${balance.toFixed(2)} DA`);
      console.log(`  Statut: ${status}`);
    }

    // 4. Vérifier TOUS les paiements dans la base
    const [allPayments] = await connection.query(`
      SELECT tenant_id, document_type, document_id, amount
      FROM stock_management.payments
      WHERE tenant_id = '2009_bu02'
      ORDER BY document_id
    `);

    console.log(`\n\n📊 TOTAL des paiements pour tenant 2009_bu02: ${allPayments.length}`);
    if (allPayments.length > 0) {
      console.table(allPayments);
    }

    // 5. Statistiques globales
    const [stats] = await connection.query(`
      SELECT 
        COUNT(DISTINCT bl.NFact) as total_bls,
        COUNT(DISTINCT p.document_id) as bls_with_payments,
        SUM(p.amount) as total_paid
      FROM 2009_bu02.bl bl
      LEFT JOIN stock_management.payments p 
        ON p.tenant_id = '2009_bu02' 
        AND p.document_type = 'delivery_note'
        AND p.document_id = bl.NFact
    `);

    console.log('\n📈 STATISTIQUES GLOBALES:');
    console.table(stats);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await connection.end();
  }
}

diagnose();
