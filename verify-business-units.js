// Script de vérification des Business Units
import mysql from 'mysql2/promise';

async function verifyBusinessUnits() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'stock_management_auth'
    });

    console.log('✅ Connecté à MySQL\n');

    // 1. Vérifier les BU dans la table business_units
    console.log('📊 BUSINESS UNITS DANS LA TABLE:');
    console.log('='.repeat(80));
    const [allBUs] = await connection.execute(
      `SELECT schema_name, bu_code, year, nom_entreprise, active 
       FROM business_units 
       WHERE active = 1
       ORDER BY year DESC, bu_code`
    );
    console.table(allBUs);
    console.log(`Total: ${allBUs.length} BU actives\n`);

    // 2. Vérifier les BU autorisées pour l'utilisateur admin
    console.log('👤 BUSINESS UNITS AUTORISÉES POUR ADMIN:');
    console.log('='.repeat(80));
    const [adminUser] = await connection.execute(
      `SELECT id, username, email, role, business_units 
       FROM users 
       WHERE username = 'admin'`
    );
    
    if (adminUser.length > 0) {
      const user = adminUser[0];
      console.log(`Utilisateur: ${user.username} (${user.role})`);
      console.log(`Email: ${user.email}`);
      
      let businessUnits = [];
      // MySQL peut retourner le JSON déjà parsé ou comme string
      if (Array.isArray(user.business_units)) {
        businessUnits = user.business_units;
      } else if (typeof user.business_units === 'string') {
        try {
          businessUnits = JSON.parse(user.business_units);
        } catch (e) {
          console.log('⚠️ Format business_units invalide');
        }
      } else {
        console.log('⚠️ Format business_units inconnu:', typeof user.business_units);
      }
      
      console.log(`\nBU autorisées (${businessUnits.length}):`);
      businessUnits.forEach((bu, index) => {
        console.log(`  ${index + 1}. ${bu}`);
      });
      
      // 3. Vérifier la correspondance
      console.log('\n🔍 VÉRIFICATION DE LA CORRESPONDANCE:');
      console.log('='.repeat(80));
      
      const buInTable = allBUs.map(bu => bu.schema_name);
      const missingInTable = businessUnits.filter(bu => !buInTable.includes(bu));
      const matchingBUs = businessUnits.filter(bu => buInTable.includes(bu));
      
      console.log(`✅ BU correspondantes: ${matchingBUs.length}/${businessUnits.length}`);
      matchingBUs.forEach(bu => {
        const buData = allBUs.find(b => b.schema_name === bu);
        console.log(`   ✓ ${bu} - ${buData.nom_entreprise} (${buData.year})`);
      });
      
      if (missingInTable.length > 0) {
        console.log(`\n❌ BU manquantes dans la table: ${missingInTable.length}`);
        missingInTable.forEach(bu => {
          console.log(`   ✗ ${bu}`);
        });
      } else {
        console.log('\n🎉 TOUTES LES BU AUTORISÉES SONT PRÉSENTES DANS LA TABLE!');
      }
      
      // 4. Résumé
      console.log('\n📈 RÉSUMÉ:');
      console.log('='.repeat(80));
      console.log(`Total BU dans la table: ${allBUs.length}`);
      console.log(`Total BU autorisées pour admin: ${businessUnits.length}`);
      console.log(`BU correspondantes: ${matchingBUs.length}`);
      console.log(`BU manquantes: ${missingInTable.length}`);
      
      if (matchingBUs.length === businessUnits.length && businessUnits.length === allBUs.length) {
        console.log('\n✅ STATUT: PARFAIT - Toutes les BU sont synchronisées!');
      } else if (matchingBUs.length === businessUnits.length) {
        console.log('\n✅ STATUT: BON - Toutes les BU autorisées sont disponibles');
        console.log(`   (Il y a ${allBUs.length - businessUnits.length} BU supplémentaires dans la table)`);
      } else {
        console.log('\n⚠️ STATUT: ATTENTION - Certaines BU autorisées sont manquantes!');
      }
      
    } else {
      console.log('❌ Utilisateur admin non trouvé!');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

verifyBusinessUnits();
