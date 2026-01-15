const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  console.log('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAuthenticateFunction() {
  console.log('🔧 Correction de la fonction authenticate_user...\n');

  try {
    // Lire le script SQL
    const sqlScript = fs.readFileSync('FIX_AUTHENTICATE_USER_HASH.sql', 'utf8');
    
    console.log('📝 Script SQL chargé');
    console.log('🔄 Exécution sur Supabase...\n');

    // Exécuter le script via RPC (si possible) ou via query
    // Note: Supabase ne permet pas toujours l'exécution directe de CREATE FUNCTION
    // Il faut utiliser le SQL Editor dans le dashboard Supabase
    
    console.log('⚠️  IMPORTANT: Exécution manuelle requise!');
    console.log('');
    console.log('📋 Instructions:');
    console.log('1. Ouvrez votre dashboard Supabase: https://supabase.com/dashboard');
    console.log('2. Allez dans "SQL Editor"');
    console.log('3. Créez une nouvelle query');
    console.log('4. Copiez-collez le contenu de FIX_AUTHENTICATE_USER_HASH.sql');
    console.log('5. Cliquez sur "Run"');
    console.log('');
    console.log('📄 Fichier à copier: FIX_AUTHENTICATE_USER_HASH.sql');
    console.log('');
    
    // Test de la fonction après correction (à exécuter manuellement)
    console.log('🧪 Pour tester après la correction:');
    console.log('');
    console.log('SELECT authenticate_user(\'votre_username\', \'votre_password\');');
    console.log('');
    
    // Afficher les utilisateurs existants pour référence
    console.log('👥 Utilisateurs existants dans la base:');
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, role, active')
      .order('id');

    if (error) {
      console.error('❌ Erreur récupération utilisateurs:', error.message);
    } else if (users && users.length > 0) {
      console.log('');
      users.forEach(user => {
        console.log(`  ${user.active ? '✅' : '❌'} ID: ${user.id} | Username: ${user.username} | Email: ${user.email} | Role: ${user.role}`);
      });
      console.log('');
    } else {
      console.log('  Aucun utilisateur trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixAuthenticateFunction();
