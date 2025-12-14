import 'dotenv/config';
import { supabaseAdmin } from './src/supabaseClient.js';

async function testCreateFamilies() {
  console.log('🔍 Testing family creation...\n');

  // Essayer de créer les familles directement
  const families = ['Electricité', 'Droguerie', 'Peinture', 'Outillage', 'Plomberie', 'Carrelage'];
  
  for (const famille of families) {
    try {
      console.log(`Creating family: ${famille}`);
      
      // Utiliser une requête SQL directe
      const { data, error } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: `INSERT INTO "2025_bu01".famille_art (famille) VALUES ('${famille}') ON CONFLICT (famille) DO NOTHING`
      });
      
      if (error) {
        console.log(`❌ Error creating ${famille}:`, error.message);
      } else {
        console.log(`✅ Family ${famille} created/exists`);
      }
    } catch (err) {
      console.log(`❌ Unexpected error for ${famille}:`, err);
    }
  }

  // Maintenant tester la création d'un article avec une famille existante
  console.log('\n🔍 Testing article creation with existing family...');
  
  try {
    const { data, error } = await supabaseAdmin.rpc('insert_article_to_tenant', {
      p_tenant: '2025_bu01',
      p_narticle: 'TEST006',
      p_famille: 'Electricité',  // Famille qui devrait maintenant exister
      p_designation: 'Article test avec famille existante',
      p_nfournisseur: null,
      p_prix_unitaire: 200.00,
      p_marge: 30.00,
      p_tva: 19.00,
      p_prix_vente: 309.40,
      p_seuil: 15,
      p_stock_f: 40,
      p_stock_bl: 45
    });
    
    if (error) {
      console.log('❌ Error creating article:', error.message);
    } else {
      console.log('✅ Article created successfully:', data);
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err);
  }
}

testCreateFamilies();