/**
 * Script simple pour vérifier Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  VÉRIFICATION SUPABASE - Table payments               ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Configuration Supabase manquante dans backend/.env\n');
  process.exit(1);
}

console.log('📋 Configuration:\n');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey.substring(0, 20)}...\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPayments() {
  try {
    console.log('🔌 Connexion à Supabase...\n');

    // Vérifier si la table existe
    const { data, error, count } = await supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ La table "payments" N\'EXISTE PAS dans Supabase\n');
        console.log('═══════════════════════════════════════════════════════\n');
        console.log('💡 SOLUTION: Créer la table\n');
        console.log('1. Allez sur: https://supabase.com/dashboard');
        console.log('2. Ouvrez votre projet');
        console.log('3. Cliquez sur "SQL Editor"');
        console.log('4. Exécutez le fichier: backend/migrations/create_payments_table_supabase.sql');
        console.log('\n═══════════════════════════════════════════════════════\n');
        return;
      }
      throw error;
    }

    console.log('✅ Table "payments" TROUVÉE dans Supabase !\n');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`📊 Nombre total de paiements: ${count || 0}\n`);

    if (count > 0) {
      console.log('📄 Exemples de paiements:\n');
      data.forEach((payment, i) => {
        console.log(`   ${i + 1}. ID: ${payment.id}`);
        console.log(`      Tenant: ${payment.tenant_id}`);
        console.log(`      Type: ${payment.document_type}`);
        console.log(`      Document ID: ${payment.document_id}`);
        console.log(`      Montant: ${payment.amount} DA`);
        console.log(`      Date: ${payment.payment_date}`);
        console.log('');
      });

      // Compter par tenant
      const { data: allPayments } = await supabase
        .from('payments')
        .select('tenant_id, amount');

      if (allPayments) {
        const stats = {};
        allPayments.forEach(p => {
          if (!stats[p.tenant_id]) {
            stats[p.tenant_id] = { count: 0, total: 0 };
          }
          stats[p.tenant_id].count++;
          stats[p.tenant_id].total += parseFloat(p.amount);
        });

        console.log('═══════════════════════════════════════════════════════\n');
        console.log('📊 Statistiques par tenant:\n');
        Object.entries(stats).forEach(([tenant, data]) => {
          console.log(`   ${tenant}:`);
          console.log(`      Nombre: ${data.count} paiement(s)`);
          console.log(`      Total: ${data.total.toFixed(2)} DA`);
          console.log('');
        });
      }

      // Vérifier 2025_bu01 spécifiquement
      console.log('═══════════════════════════════════════════════════════\n');
      console.log('🔍 Paiements pour 2025_bu01:\n');
      
      const { data: bu01Payments, count: bu01Count } = await supabase
        .from('payments')
        .select('*', { count: 'exact' })
        .eq('tenant_id', '2025_bu01');

      if (bu01Count > 0) {
        console.log(`   ✅ ${bu01Count} paiement(s) trouvé(s)\n`);
        bu01Payments.slice(0, 3).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.document_type} #${p.document_id} - ${p.amount} DA`);
        });
      } else {
        console.log('   ⚠️  Aucun paiement pour 2025_bu01');
      }

    } else {
      console.log('⚠️  La table existe mais est VIDE\n');
      console.log('💡 Pour ajouter un paiement de test:');
      console.log('   1. Allez sur Supabase Dashboard');
      console.log('   2. Table Editor → payments');
      console.log('   3. Insert → Row');
    }

    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('✅ CONCLUSION:\n');
    console.log('VOS PAIEMENTS SONT STOCKÉS DANS SUPABASE');
    console.log('Table: public.payments');
    console.log('Isolation: Par tenant_id (ex: "2025_bu01")');
    console.log('\n═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('\nDétails:', error);
  }
}

checkPayments();
