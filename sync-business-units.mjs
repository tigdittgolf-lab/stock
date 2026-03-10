import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Mets ton mot de passe si nécessaire
  port: 3306
});

console.log('🔄 Syncing business units...\n');

// 1. Lister toutes les bases de données tenant
const [databases] = await connection.query('SHOW DATABASES');
const tenantDatabases = databases
  .map(db => db.Database)
  .filter(name => /^\d{4}_bu\d{2}$/.test(name))
  .sort();

console.log(`📊 Found ${tenantDatabases.length} tenant databases`);

// 2. Vérifier si la table business_units existe
try {
  await connection.query('SELECT 1 FROM stock_management.business_units LIMIT 1');
  console.log('✅ Table business_units exists');
} catch (error) {
  console.log('⚠️  Table business_units does not exist, creating it...');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS stock_management.business_units (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255),
      description TEXT,
      active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Table created');
}

// 3. Récupérer les BU existantes
const [existingBUs] = await connection.query(
  'SELECT tenant_id FROM stock_management.business_units'
);
const existingTenantIds = existingBUs.map(bu => bu.tenant_id);

// 4. Ajouter les BU manquantes
let added = 0;
for (const tenantDb of tenantDatabases) {
  if (!existingTenantIds.includes(tenantDb)) {
    // Extraire l'année et le code BU
    const match = tenantDb.match(/^(\d{4})_bu(\d{2})$/);
    const year = match ? match[1] : '';
    const buCode = match ? match[2] : '';
    
    const name = `Business Unit ${buCode} - ${year}`;
    const description = `Unité commerciale ${buCode} pour l'exercice ${year}`;
    
    await connection.query(
      'INSERT INTO stock_management.business_units (tenant_id, name, description, active) VALUES (?, ?, ?, 1)',
      [tenantDb, name, description]
    );
    
    console.log(`  ✅ Added: ${tenantDb} - ${name}`);
    added++;
  }
}

if (added === 0) {
  console.log('\n✅ All tenant databases are already registered');
} else {
  console.log(`\n✅ Added ${added} business units`);
}

// 5. Afficher le résultat final
const [allBUs] = await connection.query(
  'SELECT tenant_id, name, description, active FROM stock_management.business_units ORDER BY tenant_id'
);

console.log(`\n📋 Final list (${allBUs.length} business units):`);
allBUs.forEach(bu => {
  const status = bu.active ? '✓' : '✗';
  console.log(`  ${status} ${bu.tenant_id}: ${bu.name}`);
});

await connection.end();
console.log('\n✅ Done!');
