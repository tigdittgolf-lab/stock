/**
 * Script pour trouver OÙ sont stockés vos paiements
 * Vérifie MySQL ET Supabase
 */

import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  OÙ SONT MES PAIEMENTS ?                              ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// =====================================================
// 1. VÉRIFIER MYSQL LOCAL
// =====================================================
async function checkMySQL() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('1️⃣  VÉRIFICATION MYSQL LOCAL\n');

  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3307'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
  };

  console.log('Configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}\n`);

  try {
    console.log('🔌 Connexion à MySQL...');
    const connection = await mysql.createConnection(config);
    console.log('✅ MySQL est accessible\n');

    // Lister les bases
    const [databases] = await connection.query('SHOW DATABASES');
    const userDbs = databases.filter(db => 
      !['information_schema', 'mysql', 'performance_schema', 'sys'].includes(db.Database)
    );

    console.log(`📊 Bases de données trouvées: ${userDbs.length}\n`);
    userDbs.forEach(db => {
      console.log(`   📁 ${db.Database}`);
    });

    // Chercher la table payments dans chaque base
    console.log('\n🔍 Recherche de la table "payments"...\n');
    
    let foundPayments = false;
    for (const db of userDbs) {
      const dbName = db.Database;
      await connection.query(`USE \`${dbName}\``);
      const [tables] = await connection.query('SHOW TABLES');
      
      const hasPayments = tables.some(table => {
        const tableName = Object.values(table)[0];
        return tableName.toLowerCase() === 'payments';
      });

      if (hasPayments) {
        foundPayments = true;
        console.log(`   ✅ TROUVÉ dans: ${dbName}`);
        
        // Compter les paiements
        const [count] = await connection.query('SELECT COUNT(*) as total FROM payments');
        console.log(`      Nombre de paiements: ${count[0].total}`);
        
        if (count[0].total > 0) {
          const [sample] = await connection.query('SELECT * FROM payments LIMIT 1');
          console.log(`      Exemple: tenant_id="${sample[0].tenant_id}", amount=${sample[0].amount}`);
        }
        console.log('');
      }
    }

    if (!foundPayments) {
      console.log('   ❌ Table "payments" introuvable dans MySQL\n');
    }

    await connection.end();
    return foundPayments;

  } catch (error) {
    console.log(`❌ MySQL non accessible: ${error.message}\n`);
    return false;
  }
}

// =====================================================
// 2. VÉRIFIER SUPABASE (POSTGRESQL)
// =====================================================
async function checkSupabase() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('2️⃣  VÉRIFICATION SUPABASE (PostgreSQL)\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Configuration Supabase manquante dans .env\n');
    return false;
  }

  console.log('Configuration:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey ? '✅ Définie' : '❌ Manquante'}\n`);

  try {
    console.log('🔌 Connexion à Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Tester la connexion en cherchant la table payments
    const { data, error, count } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ Table "payments" n\'existe pas dans Supabase\n');
        return false;
      }
      throw error;
    }

    console.log('✅ Supabase est accessible\n');
    console.log(`📊 Table "payments" trouvée !\n`);
    console.log(`   Nombre de paiements: ${count || 0}\n`);

    if (count > 0) {
      // Récupérer quelques exemples
      const { data: samples } = await supabase
        .from('payments')
        .select('*')
        .limit(3);

      console.log('   📄 Exemples de paiements:\n');
      samples.forEach((payment, i) => {
        console.log(`      ${i + 1}. ID: ${payment.id}, Tenant: ${payment.tenant_id}, Montant: ${payment.amount}`);
      });
      console.log('');

      // Compter par tenant
      const { data: tenants } = await supabase
        .from('payments')
        .select('tenant_id');

      if (tenants) {
        const tenantCounts = {};
        tenants.forEach(p => {
          tenantCounts[p.tenant_id] = (tenantCounts[p.tenant_id] || 0) + 1;
        });

        console.log('   📊 Paiements par tenant:\n');
        Object.entries(tenantCounts).forEach(([tenant, count]) => {
          console.log(`      ${tenant}: ${count} paiement(s)`);
        });
        console.log('');
      }
    }

    return true;

  } catch (error) {
    console.log(`❌ Supabase non accessible: ${error.message}\n`);
    return false;
  }
}

// =====================================================
// 3. RÉSUMÉ ET RECOMMANDATIONS
// =====================================================
async function main() {
  const mysqlFound = await checkMySQL();
  const supabaseFound = await checkSupabase();

  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 RÉSUMÉ\n');

  if (supabaseFound) {
    console.log('✅ VOS PAIEMENTS SONT DANS SUPABASE (PostgreSQL)\n');
    console.log('Emplacement: Table "public.payments" sur Supabase');
    console.log('URL: ' + process.env.SUPABASE_URL);
    console.log('');
    console.log('💡 Pour voir vos paiements:');
    console.log('   1. Allez sur: https://supabase.com/dashboard');
    console.log('   2. Ouvrez votre projet');
    console.log('   3. Allez dans "Table Editor"');
    console.log('   4. Cherchez la table "payments"');
    console.log('');
    console.log('💡 Pour voir les paiements de 2025_bu01:');
    console.log('   SELECT * FROM payments WHERE tenant_id = \'2025_bu01\';');
    console.log('');
  } else if (mysqlFound) {
    console.log('✅ VOS PAIEMENTS SONT DANS MYSQL LOCAL\n');
    console.log('Voir les détails ci-dessus pour l\'emplacement exact.');
    console.log('');
  } else {
    console.log('❌ TABLE "payments" INTROUVABLE\n');
    console.log('La table n\'existe ni dans MySQL ni dans Supabase.');
    console.log('');
    console.log('💡 Actions à faire:');
    console.log('');
    console.log('Option 1 - Créer dans Supabase (Recommandé):');
    console.log('   1. Allez sur: https://supabase.com/dashboard');
    console.log('   2. Ouvrez "SQL Editor"');
    console.log('   3. Exécutez: backend/migrations/create_payments_table_supabase.sql');
    console.log('');
    console.log('Option 2 - Créer dans MySQL:');
    console.log('   1. Créez la base: CREATE DATABASE stock_management;');
    console.log('   2. Exécutez: backend/migrations/create_payments_table_mysql.sql');
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
