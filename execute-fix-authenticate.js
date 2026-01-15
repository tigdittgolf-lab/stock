const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeFixDirectly() {
  console.log('🔧 Correction de la fonction authenticate_user avec hash SHA-256\n');

  try {
    // Créer la fonction directement avec le SQL correct
    const sqlFunction = `
CREATE OR REPLACE FUNCTION authenticate_user(
    p_username VARCHAR,
    p_password VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_result JSON;
    v_password_hash TEXT;
BEGIN
    -- Hasher le mot de passe fourni avec SHA-256
    v_password_hash := encode(digest(p_password, 'sha256'), 'hex');
    
    -- Récupérer l'utilisateur par username OU email
    SELECT 
        id, username, email, password_hash, full_name, role, 
        business_units, active
    INTO v_user
    FROM public.users
    WHERE (username = p_username OR email = p_username) AND active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Utilisateur non trouvé ou inactif'
        );
    END IF;
    
    -- Vérifier le mot de passe hashé
    IF v_user.password_hash != v_password_hash THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Mot de passe incorrect'
        );
    END IF;
    
    -- Mettre à jour la date de dernière connexion
    UPDATE public.users 
    SET last_login = CURRENT_TIMESTAMP 
    WHERE id = v_user.id;
    
    -- Retourner les informations de l'utilisateur
    v_result := json_build_object(
        'success', true,
        'user', json_build_object(
            'id', v_user.id,
            'username', v_user.username,
            'email', v_user.email,
            'full_name', v_user.full_name,
            'role', v_user.role,
            'business_units', v_user.business_units
        )
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erreur lors de l''authentification: ' || SQLERRM
        );
END;
$$;
`;

    console.log('📝 Tentative d\'exécution via Supabase REST API...\n');

    // Utiliser l'API REST de Supabase pour exécuter le SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sqlFunction })
    });

    if (response.ok) {
      console.log('✅ Fonction corrigée avec succès!\n');
    } else {
      console.log('⚠️  L\'API REST n\'est pas disponible pour cette opération\n');
      console.log('📋 SOLUTION MANUELLE:');
      console.log('1. Ouvrez: https://supabase.com/dashboard/project/szgodrjglbpzkrksnroi/sql/new');
      console.log('2. Copiez le contenu de FIX_AUTHENTICATE_USER_HASH.sql');
      console.log('3. Collez dans l\'éditeur SQL');
      console.log('4. Cliquez sur "Run"\n');
    }

    // Test avec l'utilisateur habib
    console.log('🧪 Test de connexion avec l\'utilisateur "habib"...\n');
    
    const { data, error } = await supabase.rpc('authenticate_user', {
      p_username: 'habib',
      p_password: 'test123'  // Remplacez par le vrai mot de passe
    });

    if (error) {
      console.log('❌ Erreur test:', error.message);
      console.log('\n⚠️  La fonction n\'est pas encore corrigée.');
      console.log('📝 Veuillez exécuter manuellement le script SQL.\n');
    } else {
      console.log('✅ Test réussi!');
      console.log('Résultat:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

executeFixDirectly();
