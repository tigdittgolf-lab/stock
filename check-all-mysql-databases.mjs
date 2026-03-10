import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Mets ton mot de passe si nécessaire
  port: 3306
});

console.log('🔍 Checking all MySQL databases...\n');

// 1. Lister toutes les bases de données
const [databases] = await connection.query('SHOW DATABASES');
console.log('📊 All databases:');
databases.forEach(db => {
  console.log(`  - ${db.Database}`);
});

console.log('\n📋 Filtering tenant databases (pattern: YYYY_buXX):');
const tenantDatabases = databases
  .map(db => db.Database)
  .filter(name => /^\d{4}_bu\d{2}$/.test(name))
  .sort();

console.log(`Found ${tenantDatabases.length} tenant databases:`);
tenantDatabases.forEach(db => {
  console.log(`  ✓ ${db}`);
});

// 2. Vérifier la table business_units dans stock_management
console.log('\n📋 Checking business_units table in stock_management:');
try {
  const [businessUnits] = await connection.query(`
    SELECT * FROM stock_management.business_units ORDER BY tenant_id
  `);
  
  console.log(`Found ${businessUnits.length} business units in table:`);
  businessUnits.forEach(bu => {
    console.log(`  - ${bu.tenant_id}: ${bu.name || 'No name'} (${bu.description || 'No description'})`);
  });
  
  // 3. Comparer les deux listes
  console.log('\n🔍 Comparison:');
  const buTenantIds = businessUnits.map(bu => bu.tenant_id);
  
  const missingInTable = tenantDatabases.filter(db => !buTenantIds.includes(db));
  const missingDatabase = buTenantIds.filter(id => !tenantDatabases.includes(id));
  
  if (missingInTable.length > 0) {
    console.log('\n⚠️  Databases exist but NOT in business_units table:');
    missingInTable.forEach(db => {
      console.log(`  - ${db}`);
    });
  }
  
  if (missingDatabase.length > 0) {
    console.log('\n⚠️  In business_units table but database does NOT exist:');
    missingDatabase.forEach(id => {
      console.log(`  - ${id}`);
    });
  }
  
  if (missingInTable.length === 0 && missingDatabase.length === 0) {
    console.log('✅ All databases are properly registered in business_units table');
  }
  
} catch (error) {
  console.error('❌ Error checking business_units table:', error.message);
}

await connection.end();
console.log('\n✅ Done!');
