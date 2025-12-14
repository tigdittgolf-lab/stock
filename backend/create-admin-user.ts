import { supabaseAdmin } from './src/supabaseClient.js';

async function createAdminUser() {
  console.log('👤 CRÉATION D\'UN UTILISATEUR ADMINISTRATEUR');
  console.log('==========================================\n');
  
  try {
    // Informations de l'utilisateur administrateur par défaut
    const adminUser = {
      email: 'admin@stock.dz',
      password: 'admin123',
      nom: 'Administrateur',
      role: 'admin'
    };
    
    console.log('📝 Création de l\'utilisateur administrateur...');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Mot de passe: ${adminUser.password}`);
    console.log(`   Nom: ${adminUser.nom}`);
    console.log(`   Rôle: ${adminUser.role}`);
    
    // Créer l'utilisateur avec Supabase Admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: adminUser.email,
      password: adminUser.password,
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        nom: adminUser.nom,
        role: adminUser.role,
        created_by: 'setup_script',
        created_at: new Date().toISOString()
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('⚠️ L\'utilisateur existe déjà');
        
        // Lister les utilisateurs existants
        console.log('\n📋 Utilisateurs existants:');
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          console.error('❌ Erreur lors de la liste des utilisateurs:', listError.message);
        } else {
          users.users.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
            console.log(`      Créé le: ${new Date(user.created_at).toLocaleString('fr-FR')}`);
            console.log(`      Métadonnées: ${JSON.stringify(user.user_metadata)}`);
            console.log('');
          });
        }
        
        return;
      } else {
        console.error('❌ Erreur lors de la création de l\'utilisateur:', error.message);
        return;
      }
    }

    console.log('✅ Utilisateur administrateur créé avec succès !');
    console.log(`   ID utilisateur: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Confirmé: ${data.user.email_confirmed_at ? 'Oui' : 'Non'}`);
    
    // Créer également un utilisateur de test
    console.log('\n👤 Création d\'un utilisateur de test...');
    
    const testUser = {
      email: 'test@stock.dz',
      password: 'test123',
      nom: 'Utilisateur Test',
      role: 'user'
    };
    
    const { data: testData, error: testError } = await supabaseAdmin.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: {
        nom: testUser.nom,
        role: testUser.role,
        created_by: 'setup_script',
        created_at: new Date().toISOString()
      },
    });

    if (testError) {
      if (testError.message.includes('already registered')) {
        console.log('⚠️ L\'utilisateur de test existe déjà');
      } else {
        console.error('❌ Erreur utilisateur de test:', testError.message);
      }
    } else {
      console.log('✅ Utilisateur de test créé avec succès !');
      console.log(`   Email: ${testData.user.email}`);
    }
    
    // Afficher les informations de connexion
    console.log('\n🔑 INFORMATIONS DE CONNEXION');
    console.log('============================');
    console.log('');
    console.log('👨‍💼 ADMINISTRATEUR:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Mot de passe: ${adminUser.password}`);
    console.log('');
    console.log('👤 UTILISATEUR TEST:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Mot de passe: ${testUser.password}`);
    console.log('');
    console.log('🌐 URL de connexion: http://localhost:3000/login');
    console.log('');
    console.log('📋 ÉTAPES APRÈS CONNEXION:');
    console.log('1. Connectez-vous avec un des comptes ci-dessus');
    console.log('2. Sélectionnez le tenant (BU + Année)');
    console.log('3. Accédez à l\'application');
    
    // Tester la connexion
    console.log('\n🧪 Test de connexion...');
    
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: adminUser.email,
      password: adminUser.password,
    });
    
    if (signInError) {
      console.error('❌ Erreur de test de connexion:', signInError.message);
    } else {
      console.log('✅ Test de connexion réussi !');
      console.log('   L\'utilisateur peut se connecter correctement');
      
      // Se déconnecter après le test
      await supabaseAdmin.auth.signOut();
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createAdminUser();