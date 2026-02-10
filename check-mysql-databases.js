/**
 * Script pour vérifier les bases de données MySQL existantes
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

async function checkDatabases() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Vérification des Bases de Données MySQL              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Configuration depuis .env
  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3307'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
  };

  console.log('📋 Configuration MySQL:\n');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Password: ${config.password ? '✅ Défini' : '❌ Vide'}\n`);

  let connection;

  try {
    // Connexion sans spécifier de base de données
    console.log('🔌 Connexion au serveur MySQL...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connecté au serveur MySQL\n');

    // Lister toutes les bases de données
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📊 BASES DE DONNÉES DISPONIBLES\n');

    const [databases] = await connection.query('SHOW DATABASES');
    
    console.log(`Nombre total: ${databases.length}\n`);
    
    databases.forEach((db, index) => {
      const dbName = db.Database;
      const isSystem = ['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbName);
      const icon = isSystem ? '🔧' : '📁';
      console.log(`${icon} ${index + 1}. ${dbName}${isSystem ? ' (système)' : ''}`);
    });

    // Chercher les bases qui ressemblent à des tenants
    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('🔍 BASES DE DONNÉES TENANT (bu)\n');

    const tenantDbs = databases.filter(db => {
      const name = db.Database.toLowerCase();
      return name.includes('bu') || name.includes('2024') || name.includes('2025');
    });

    if (tenantDbs.length > 0) {
      console.log(`Trouvé ${tenantDbs.length} base(s) tenant:\n`);
      tenantDbs.forEach(db => {
        console.log(`   📦 ${db.Database}`);
      });
    } else {
      console.log('❌ Aucune base de données tenant trouvée');
      console.log('   (Recherche de bases contenant "bu", "2024" ou "2025")');
    }

    // Chercher stock_management
    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('🔍 RECHERCHE DE "stock_management"\n');

    const stockDb = databases.find(db => 
      db.Database.toLowerCase().includes('stock')
    );

    if (stockDb) {
      console.log(`✅ Trouvé: ${stockDb.Database}\n`);
      
      // Se connecter à cette base et voir les tables
      await connection.changeUser({ database: stockDb.Database });
      
      console.log(`📊 Tables dans ${stockDb.Database}:\n`);
      const [tables] = await connection.query('SHOW TABLES');
      
      if (tables.length > 0) {
        tables.forEach((table, index) => {
          const tableName = Object.values(table)[0];
          console.log(`   ${index + 1}. ${tableName}`);
        });
        
        // Chercher la table payments
        const hasPayments = tables.some(table => 
          Object.values(table)[0].toLowerCase() === 'payments'
        );
        
        if (hasPayments) {
          console.log('\n   ✅ Table "payments" trouvée !');
          
          // Voir la structure
          const [structure] = await connection.query('DESCRIBE payments');
          console.log('\n   📋 Structure de la table payments:\n');
          structure.forEach(col => {
            console.log(`      - ${col.Field} (${col.Type})`);
          });
          
          // Compter les enregistrements
          const [count] = await connection.query('SELECT COUNT(*) as total FROM payments');
          console.log(`\n   📊 Nombre de paiements: ${count[0].total}`);
          
          if (count[0].total > 0) {
            // Voir quelques exemples
            const [samples] = await connection.query('SELECT * FROM payments LIMIT 3');
            console.log('\n   📄 Exemples de paiements:\n');
            samples.forEach((payment, i) => {
              console.log(`      ${i + 1}. ID: ${payment.id}, Tenant: ${payment.tenant_id}, Montant: ${payment.amount}`);
            });
          }
        } else {
          console.log('\n   ❌ Table "payments" non trouvée');
        }
      } else {
        console.log('   ⚠️  Aucune table dans cette base');
      }
    } else {
      console.log('❌ Aucune base contenant "stock" trouvée\n');
      console.log('💡 Bases disponibles (hors système):');
      const userDbs = databases.filter(db => 
        !['information_schema', 'mysql', 'performance_schema', 'sys'].includes(db.Database)
      );
      userDbs.forEach(db => {
        console.log(`   - ${db.Database}`);
      });
    }

    // Recommandations
    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('💡 RECOMMANDATIONS\n');

    if (!stockDb) {
      console.log('La base "stock_management" n\'existe pas.');
      console.log('Options:');
      console.log('   1. Créer la base: CREATE DATABASE stock_management;');
      console.log('   2. Utiliser une base existante et mettre à jour .env');
      console.log('   3. Vérifier si vous utilisez PostgreSQL au lieu de MySQL');
    } else if (stockDb && !tables.some(t => Object.values(t)[0].toLowerCase() === 'payments')) {
      console.log('La base existe mais la table "payments" n\'existe pas.');
      console.log('Action: Exécuter la migration create_payments_table_mysql.sql');
    } else {
      console.log('✅ Tout semble correct !');
    }

    console.log('\n═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERREUR\n');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Le serveur MySQL n\'est pas accessible. Vérifiez:');
      console.error('   - MySQL est démarré');
      console.error('   - Le port est correct (3307)');
      console.error('   - Le host est correct (localhost)');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Accès refusé. Vérifiez:');
      console.error('   - Le nom d\'utilisateur (MYSQL_USER)');
      console.error('   - Le mot de passe (MYSQL_PASSWORD)');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

checkDatabases();
