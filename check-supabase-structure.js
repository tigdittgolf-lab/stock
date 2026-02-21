/**
 * Vérifier la structure des schémas dans Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

async function checkStructure() {
  console.log('🔍 VÉRIFICATION DE LA STRUCTURE SUPABASE\n');
  console.log('='.repeat(70));

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Essayer de lister les tables dans public
  console.log('\n📋 Tables dans le schéma PUBLIC:');
  
  try {
    // Utiliser une requête RPC pour lister les tables
    const { data, error } = await supabase.rpc('get_all_tables');
    
    if (error) {
      console.log('  ❌ Fonction get_all_tables non disponible:', error.message);
    } else {
      console.log('  ✅ Tables trouvées:', data);
    }
  } catch (e) {
    console.log('  ⚠️  Impossible de lister via RPC');
  }

  // Essayer d'accéder aux tables connues
  const knownTables = ['article', 'client', 'fournisseur', 'detail_bl', 'users'];
  
  console.log('\n📋 Test d\'accès aux tables connues:');
  for (const table of knownTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ ${table}: ${count} enregistrements`);
      }
    } catch (e) {
      console.log(`  ❌ ${table}: Exception - ${e.message}`);
    }
  }

  // Vérifier les schémas tenant
  console.log('\n📋 Vérification des schémas TENANT (2025_bu01, etc.):');
  
  const tenantSchemas = ['2025_bu01', '2025_bu02', '2024_bu01'];
  
  for (const schema of tenantSchemas) {
    console.log(`\n  🔍 Schéma: ${schema}`);
    
    // Dans Supabase, les schémas ne sont pas directement accessibles via l'API REST
    // Il faut utiliser des vues ou des fonctions RPC
    
    try {
      // Essayer d'accéder à une table avec préfixe de schéma
      const { data, error } = await supabase
        .from(`${schema}.article`)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`    ❌ ${schema}.article: ${error.message}`);
      } else {
        console.log(`    ✅ ${schema}.article accessible`);
      }
    } catch (e) {
      console.log(`    ❌ ${schema}: ${e.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n💡 CONCLUSION:');
  console.log('  - Supabase utilise le schéma PUBLIC par défaut');
  console.log('  - Les tables doivent être dans PUBLIC pour être accessibles via l\'API REST');
  console.log('  - Les schémas tenant (2025_bu01, etc.) ne sont pas accessibles directement');
  console.log('  - Solution: Créer les tables dans PUBLIC ou utiliser des vues/RPC');
}

checkStructure();
