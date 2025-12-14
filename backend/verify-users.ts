import { supabaseAdmin } from './src/supabaseClient.js';

async function verifyUsers() {
  console.log('🔍 VÉRIFICATION DES UTILISATEURS');
  console.log('===============================\n');
  
  try {
    // Lister tous les utilisateurs
    console.log('📋 Liste des utilisateurs dans la base...');
    
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', error.message);
      return;
    }
    
    if (!data.users || data.users.length === 0) {
      console.log('⚠️ Aucun utilisateur trouvé dans la base');
      console.log('   → Exécutez: bun run create-admin-user.ts');
      return;
    }
    
    console.log(`✅ ${data.users.length} utilisateur(s) trouvé(s):\n`);
    
    data.users.forEach((user, index) => {
      console.log(`👤 Utilisateur ${index + 1}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Créé le: ${new Date(user.created_at).toLocaleString('fr-FR')}`);
      console.log(`   Email confirmé: ${user.email_confirmed_at ? 'Oui' : 'Non'}`);
      console.log(`   Dernière connexion: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('fr-FR') : 'Jamais'}`);
      
      if (user.user_metadata && Object.keys(user.user_metadata).length > 0) {
        console.log(`   Métadonnées: ${JSON.stringify(user.user_metadata, null, 2)}`);
      }
      
      console.log('');
    });
    
    // Tester la connexion avec les identifiants par défaut
    console.log('🧪 Test de connexion avec admin@stock.dz...');
    
    try {
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: 'admin@stock.dz',
        password: 'admin123',
      });
      
      if (signInError) {
        console.error('❌ Erreur de connexion:', signInError.message);
        
        if (signInError.message.includes('Invalid login credentials')) {
          console.log('\n💡 SOLUTIONS POSSIBLES:');
          console.log('1. L\'utilisateur n\'existe pas → Exécutez: bun run create-admin-user.ts');
          console.log('2. Mauvais mot de passe → Vérifiez les identifiants');
          console.log('3. Email non confirmé → Vérifiez la confirmation d\'email');
        }
      } else {
        console.log('✅ Test de connexion réussi !');
        console.log(`   Utilisateur connecté: ${signInData.user.email}`);
        
        // Se déconnecter après le test
        await supabaseAdmin.auth.signOut();
        console.log('   Déconnexion effectuée');
      }
    } catch (testError) {
      console.error('❌ Erreur lors du test:', testError.message);
    }
    
    // Vérifier la configuration Supabase
    console.log('\n🔧 Vérification de la configuration...');
    console.log(`   URL Supabase: ${process.env.SUPABASE_URL}`);
    console.log(`   Projet ID: ${process.env.SUPABASE_URL?.split('//')[1]?.split('.')[0]}`);
    
    // Informations pour le frontend
    console.log('\n📱 Configuration Frontend:');
    console.log('   Vérifiez que frontend/.env.local contient:');
    console.log(`   NEXT_PUBLIC_SUPABASE_URL=${process.env.SUPABASE_URL}`);
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=<votre_clé_anon>');
    
    console.log('\n🎯 IDENTIFIANTS DE CONNEXION:');
    console.log('============================');
    console.log('👨‍💼 ADMINISTRATEUR:');
    console.log('   Email: admin@stock.dz');
    console.log('   Mot de passe: admin123');
    console.log('');
    console.log('👤 UTILISATEUR TEST:');
    console.log('   Email: test@stock.dz');
    console.log('   Mot de passe: test123');
    console.log('');
    console.log('🌐 URL: http://localhost:3000/login');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

verifyUsers();