// Script pour vérifier que la configuration est correcte
import { readFileSync } from 'fs';

function verifyConfiguration() {
  console.log('🔍 VÉRIFICATION DE LA CONFIGURATION');
  console.log('==================================\n');
  
  try {
    // Lire les configurations
    const backendEnv = readFileSync('backend/.env', 'utf8');
    const frontendEnv = readFileSync('frontend/.env.local', 'utf8');
    
    // Extraire les URLs
    const backendUrl = backendEnv.match(/SUPABASE_URL=(.+)/)?.[1];
    const frontendUrl = frontendEnv.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1];
    
    // Extraire les clés
    const serviceRoleKey = backendEnv.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1];
    const anonKey = frontendEnv.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1];
    
    console.log('📊 CONFIGURATION ACTUELLE:');
    console.log(`   Backend URL:  ${backendUrl}`);
    console.log(`   Frontend URL: ${frontendUrl}`);
    console.log(`   Service Key:  ${serviceRoleKey?.substring(0, 20)}...`);
    console.log(`   Anon Key:     ${anonKey?.substring(0, 20)}...`);
    
    // Vérifier la cohérence
    if (backendUrl === frontendUrl) {
      console.log('\n✅ URLs cohérentes');
    } else {
      console.log('\n❌ URLs incohérentes !');
      return false;
    }
    
    // Vérifier que les clés ne sont pas des placeholders
    if (serviceRoleKey?.includes('VOUS_DEVEZ_RECUPERER')) {
      console.log('❌ SERVICE_ROLE_KEY non configurée !');
      console.log('   → Allez sur votre dashboard Supabase');
      console.log('   → Settings > API > service_role key');
      return false;
    }
    
    if (anonKey?.includes('VOTRE_ANON_KEY')) {
      console.log('❌ ANON_KEY non configurée !');
      return false;
    }
    
    console.log('✅ Configuration semble correcte');
    
    // Extraire l'ID du projet
    const projectId = backendUrl?.split('//')[1]?.split('.')[0];
    console.log(`\n🎯 Projet Supabase: ${projectId}`);
    console.log(`   Dashboard: https://supabase.com/dashboard/project/${projectId}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

const isValid = verifyConfiguration();

if (isValid) {
  console.log('\n🚀 PRÊT POUR LE DÉPLOIEMENT !');
  console.log('   Commande: bun run deploy-complete-system.ts');
} else {
  console.log('\n⚠️  CONFIGURATION INCOMPLÈTE');
  console.log('   Corrigez les erreurs avant de continuer');
}