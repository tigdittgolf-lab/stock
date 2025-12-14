// Script pour créer les utilisateurs dans la nouvelle base de données
import { supabaseAdmin } from './src/supabaseClient.js';

async function createUsers() {
  console.log('👥 CRÉATION DES UTILISATEURS');
  console.log('============================\n');
  
  const users = [
    {
      email: 'admin@stock.dz',
      password: 'admin123',
      role: 'admin'
    },
    {
      email: 'test@stock.dz', 
      password: 'test123',
      role: 'user'
    }
  ];
  
  for (const user of users) {
    console.log(`📝 Création de l'utilisateur: ${user.email}`);
    
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Confirmer automatiquement l'email
        user_metadata: {
          role: user.role,
          created_by: 'system'
        }
      });
      
      if (error) {
        console.error(`❌ Erreur pour ${user.email}:`, error.message);
      } else {
        console.log(`✅ Utilisateur créé: ${user.email} (ID: ${data.user?.id})`);
      }
      
    } catch (e) {
      console.error(`❌ Exception pour ${user.email}:`, e.message);
    }
  }
  
  console.log('\n🎉 CRÉATION TERMINÉE !');
  console.log('======================');
  console.log('📋 Utilisateurs disponibles:');
  console.log('   admin@stock.dz / admin123 (administrateur)');
  console.log('   test@stock.dz / test123 (utilisateur)');
  console.log('\n🚀 Vous pouvez maintenant vous connecter !');
}

createUsers();