const { createClient } = require('@supabase/supabase-js');
const mysql = require('mysql2/promise');
const { Client } = require('pg');
const fs = require('fs');

// Configuration
const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU'
  },
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'stock_management'
  },
  postgresql: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DATABASE || 'stock_management'
  }
};

async function fixSupabase() {
  console.log('\n🔧 SUPABASE - Correction de authenticate_user...\n');
  
  try {
    const sqlScript = fs.readFileSync('FIX_AUTHENTICATE_USER_HASH.sql', 'utf8');
    
    console.log('⚠️  Supabase nécessite une exécution manuelle via le SQL Editor');
    console.log('📋 Instructions:');
    console.log('1. Ouvrez: https://supabase.com/dashboard/project/szgodrjglbpzkrksnroi/sql/new');
    console.log('2. Copiez le contenu de: FIX_AUTHENTICATE_USER_HASH.sql');
    console.log('3. Collez dans l\'éditeur SQL');
    console.log('4. Cliquez sur "Run"');
    console.log('');
    
    // Test de connexion
    const supabase = createClient(config.supabase.url, config.supabase.key);
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username')
      .limit(1);
    
    if (error) {
      console.log('❌ Erreur connexion Supabase:', error.message);
    } else {
      console.log('✅ Connexion Supabase OK');
      console.log(`📊 ${users?.length || 0} utilisateur(s) trouvé(s)`);
    }
    
  } catch (error) {
    console.error('❌ Erreur Supabase:', error.message);
  }
}

async function fixMySQL() {
  console.log('\n🔧 MYSQL - Correction de authenticate_user...\n');
  
  try {
    const sqlScript = fs.readFileSync('FIX_AUTHENTICATE_MYSQL.sql', 'utf8');
    
    console.log('📝 Tentative de connexion à MySQL...');
    console.log(`   Host: ${config.mysql.host}:${config.mysql.port}`);
    console.log(`   Database: ${config.mysql.database}`);
    console.log(`   User: ${config.mysql.user}`);
    console.log('');
    
    const connection = await mysql.createConnection(config.mysql);
    
    console.log('✅ Connexion MySQL établie');
    console.log('🔄 Exécution du script...');
    console.log('');
    
    // Exécuter le script (MySQL nécessite d'exécuter les commandes séparément)
    const statements = sqlScript
      .split('$$')
      .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--') && stmt.trim() !== 'DELIMITER');
    
    for (const statement of statements) {
      const cleanStmt = statement.trim();
      if (cleanStmt && !cleanStmt.startsWith('SELECT \'✅')) {
        try {
          await connection.query(cleanStmt);
        } catch (err) {
          // Ignorer les erreurs de DROP si la fonction n'existe pas
          if (!err.message.includes('does not exist')) {
            throw err;
          }
        }
      }
    }
    
    console.log('✅ Fonction authenticate_user corrigée pour MySQL!');
    console.log('🔐 Hash SHA-256 activé');
    
    // Test de la fonction
    console.log('\n🧪 Test de la fonction...');
    const [rows] = await connection.query(
      "SELECT authenticate_user('admin', 'admin123') as result"
    );
    
    if (rows && rows[0]) {
      const result = JSON.parse(rows[0].result);
      if (result.success) {
        console.log('✅ Test réussi! Fonction opérationnelle');
      } else {
        console.log('⚠️  Test échoué:', result.error);
      }
    }
    
    await connection.end();
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  MySQL non accessible');
      console.log('   Vérifiez que MySQL est démarré');
      console.log('   Host:', config.mysql.host);
      console.log('   Port:', config.mysql.port);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('❌ Accès refusé à MySQL');
      console.log('   Vérifiez les identifiants dans la configuration');
    } else {
      console.error('❌ Erreur MySQL:', error.message);
    }
    console.log('\n📝 Pour exécuter manuellement:');
    console.log('   mysql -u root -p < FIX_AUTHENTICATE_MYSQL.sql');
  }
}

async function fixPostgreSQL() {
  console.log('\n🔧 POSTGRESQL - Correction de authenticate_user...\n');
  
  try {
    const sqlScript = fs.readFileSync('FIX_AUTHENTICATE_POSTGRESQL.sql', 'utf8');
    
    console.log('📝 Tentative de connexion à PostgreSQL...');
    console.log(`   Host: ${config.postgresql.host}:${config.postgresql.port}`);
    console.log(`   Database: ${config.postgresql.database}`);
    console.log(`   User: ${config.postgresql.user}`);
    console.log('');
    
    const client = new Client(config.postgresql);
    await client.connect();
    
    console.log('✅ Connexion PostgreSQL établie');
    console.log('🔄 Exécution du script...');
    console.log('');
    
    // Exécuter le script complet
    await client.query(sqlScript);
    
    console.log('✅ Fonction authenticate_user corrigée pour PostgreSQL!');
    console.log('🔐 Hash SHA-256 activé');
    
    // Test de la fonction
    console.log('\n🧪 Test de la fonction...');
    const result = await client.query(
      "SELECT authenticate_user('admin', 'admin123') as result"
    );
    
    if (result.rows && result.rows[0]) {
      const authResult = result.rows[0].result;
      if (authResult.success) {
        console.log('✅ Test réussi! Fonction opérationnelle');
      } else {
        console.log('⚠️  Test échoué:', authResult.error);
      }
    }
    
    await client.end();
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  PostgreSQL non accessible');
      console.log('   Vérifiez que PostgreSQL est démarré');
      console.log('   Host:', config.postgresql.host);
      console.log('   Port:', config.postgresql.port);
    } else if (error.code === '28P01') {
      console.log('❌ Accès refusé à PostgreSQL');
      console.log('   Vérifiez les identifiants dans la configuration');
    } else {
      console.error('❌ Erreur PostgreSQL:', error.message);
    }
    console.log('\n📝 Pour exécuter manuellement:');
    console.log('   psql -U postgres -d stock_management < FIX_AUTHENTICATE_POSTGRESQL.sql');
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  🔐 CORRECTION AUTHENTICATE_USER - TOUTES LES BASES       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  // Supabase
  await fixSupabase();
  
  // MySQL
  await fixMySQL();
  
  // PostgreSQL
  await fixPostgreSQL();
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  📋 RÉSUMÉ                                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('✅ Scripts SQL créés pour les 3 bases de données:');
  console.log('   - FIX_AUTHENTICATE_USER_HASH.sql (Supabase)');
  console.log('   - FIX_AUTHENTICATE_MYSQL.sql (MySQL)');
  console.log('   - FIX_AUTHENTICATE_POSTGRESQL.sql (PostgreSQL)');
  console.log('');
  console.log('📝 Tous les scripts hashent le mot de passe avec SHA-256');
  console.log('🔐 Compatible avec les utilisateurs créés via l\'admin');
  console.log('');
  console.log('⚠️  Pour Supabase: Exécution manuelle requise via SQL Editor');
  console.log('✅ Pour MySQL/PostgreSQL: Exécution automatique si accessible');
  console.log('');
}

main().catch(console.error);
