const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createRPCFunctions() {
  console.log('🔧 Création des fonctions RPC pour les détails BL...');
  
  // Fonction 1: get_bl_details_by_id
  const function1 = `
CREATE OR REPLACE FUNCTION public.get_bl_details_by_id(
    p_tenant TEXT,
    p_nfact INTEGER
)
RETURNS TABLE (
    narticle TEXT,
    designation TEXT,
    qte INTEGER,
    prix NUMERIC,
    tva NUMERIC,
    total_ligne NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    schema_name TEXT;
BEGIN
    schema_name := p_tenant;
    
    RETURN QUERY EXECUTE format('
        SELECT 
            d.narticle::TEXT,
            COALESCE(a.designation, ''Article '' || d.narticle)::TEXT as designation,
            d.qte::INTEGER,
            d.prix::NUMERIC,
            d.tva::NUMERIC,
            d.total_ligne::NUMERIC
        FROM %I.detail_bl d
        LEFT JOIN %I.article a ON d.narticle = a.narticle
        WHERE d.nfact = $1
        ORDER BY d.narticle
    ', schema_name, schema_name)
    USING p_nfact;
END;
$$;
`;

  // Fonction 2: get_bl_details
  const function2 = `
CREATE OR REPLACE FUNCTION public.get_bl_details(
    p_tenant TEXT,
    p_nfact INTEGER
)
RETURNS TABLE (
    narticle TEXT,
    designation TEXT,
    qte INTEGER,
    prix NUMERIC,
    tva NUMERIC,
    total_ligne NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    schema_name TEXT;
BEGIN
    schema_name := p_tenant;
    
    RETURN QUERY EXECUTE format('
        SELECT 
            d.narticle::TEXT,
            COALESCE(a.designation, ''Article '' || d.narticle)::TEXT as designation,
            d.qte::INTEGER,
            d.prix::NUMERIC,
            d.tva::NUMERIC,
            d.total_ligne::NUMERIC
        FROM %I.detail_bl d
        LEFT JOIN %I.article a ON d.narticle = a.narticle
        WHERE d.nfact = $1
        ORDER BY d.narticle
    ', schema_name, schema_name)
    USING p_nfact;
END;
$$;
`;

  // Fonction 3: get_detail_bl_by_tenant
  const function3 = `
CREATE OR REPLACE FUNCTION public.get_detail_bl_by_tenant(
    p_tenant TEXT,
    p_nfact INTEGER
)
RETURNS TABLE (
    narticle TEXT,
    designation TEXT,
    qte INTEGER,
    prix NUMERIC,
    tva NUMERIC,
    total_ligne NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    schema_name TEXT;
BEGIN
    schema_name := p_tenant;
    
    RETURN QUERY EXECUTE format('
        SELECT 
            d.narticle::TEXT,
            COALESCE(a.designation, ''Article '' || d.narticle)::TEXT as designation,
            d.qte::INTEGER,
            d.prix::NUMERIC,
            d.tva::NUMERIC,
            d.total_ligne::NUMERIC
        FROM %I.detail_bl d
        LEFT JOIN %I.article a ON d.narticle = a.narticle
        WHERE d.nfact = $1
        ORDER BY d.narticle
    ', schema_name, schema_name)
    USING p_nfact;
END;
$$;
`;

  const functions = [
    { name: 'get_bl_details_by_id', sql: function1 },
    { name: 'get_bl_details', sql: function2 },
    { name: 'get_detail_bl_by_tenant', sql: function3 }
  ];

  for (const func of functions) {
    try {
      console.log(`🔨 Création de la fonction: ${func.name}...`);
      
      // Utiliser l'API REST de Supabase pour exécuter du SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({ query: func.sql })
      });

      if (response.ok) {
        console.log(`✅ Fonction ${func.name} créée avec succès`);
      } else {
        console.log(`⚠️ Fonction ${func.name} - Réponse: ${response.status}`);
      }
    } catch (error) {
      console.log(`⚠️ Erreur pour ${func.name}:`, error.message);
    }
  }

  // Test des fonctions
  console.log('\n🧪 Test des fonctions...');
  
  try {
    const { data, error } = await supabase.rpc('get_bl_details_by_id', {
      p_tenant: '2025_bu01',
      p_nfact: 4
    });
    
    if (error) {
      console.log('⚠️ Test get_bl_details_by_id:', error.message);
    } else {
      console.log('✅ get_bl_details_by_id fonctionne:', data?.length || 0, 'résultats');
      if (data && data.length > 0) {
        console.log('📋 Exemple de données:', data[0]);
      }
    }
  } catch (testError) {
    console.log('⚠️ Test échoué:', testError.message);
  }

  console.log('\n🎉 Processus terminé !');
}

createRPCFunctions().catch(console.error);