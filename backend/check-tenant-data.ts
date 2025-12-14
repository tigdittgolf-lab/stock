// Vérifier les données dans les schémas tenants
import { supabaseAdmin } from './src/supabaseClient.js';

async function checkTenantData() {
  console.log('🔍 VÉRIFICATION DES DONNÉES TENANT');
  console.log('=================================\n');
  
  try {
    // Test direct avec une requête SQL brute
    console.log('📊 Test requête SQL directe...');
    
    const testQueries = [
      'SELECT COUNT(*) as count FROM "2025_bu01".article',
      'SELECT narticle, designation FROM "2025_bu01".article LIMIT 5',
      'SELECT COUNT(*) as count FROM "2025_bu01".client',
      'SELECT COUNT(*) as count FROM "2025_bu01".fournisseur'
    ];
    
    for (const query of testQueries) {
      try {
        console.log(`\n🔍 Requête: ${query}`);
        
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sql: query })
        });
        
        const data = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Résultat:`, JSON.stringify(data, null, 2));
        
      } catch (e) {
        console.log(`   ❌ Erreur: ${e.message}`);
      }
    }
    
    // Test avec les RPC functions si elles existent
    console.log('\n🔧 Test des fonctions RPC...');
    
    try {
      const { data, error } = await supabaseAdmin.rpc('get_articles_by_tenant', {
        p_tenant: '2025_bu01'
      });
      
      if (error) {
        console.log('❌ RPC get_articles_by_tenant:', error.message);
      } else {
        console.log(`✅ Articles via RPC: ${data?.length || 0} trouvés`);
        if (data && data.length > 0) {
          console.log('   Premiers articles:');
          data.slice(0, 3).forEach((article: any) => {
            console.log(`   - ${article.narticle}: ${article.designation}`);
          });
        }
      }
    } catch (e) {
      console.log('⚠️  RPC non disponible:', e.message);
    }
    
    // Vérifier les schémas existants via une autre méthode
    console.log('\n📋 Vérification des schémas...');
    
    try {
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          sql: "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE '%bu%' OR schema_name LIKE '%202%'" 
        })
      });
      
      const data = await response.json();
      console.log('   Schémas tenant trouvés:', data);
      
    } catch (e) {
      console.log('⚠️  Impossible de lister les schémas:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkTenantData();