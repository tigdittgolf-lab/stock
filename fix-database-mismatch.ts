// Script pour diagnostiquer et corriger l'incohérence entre frontend et backend
import { readFileSync, writeFileSync } from 'fs';

function fixDatabaseMismatch() {
  console.log('🔍 DIAGNOSTIC DE L\'INCOHÉRENCE DES BASES DE DONNÉES');
  console.log('==================================================\n');
  
  try {
    // Lire les configurations actuelles
    const backendEnv = readFileSync('backend/.env', 'utf8');
    const frontendEnv = readFileSync('frontend/.env.local', 'utf8');
    
    // Extraire les URLs
    const backendUrl = backendEnv.match(/SUPABASE_URL=(.+)/)?.[1];
    const frontendUrl = frontendEnv.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1];
    
    // Extraire les IDs de projet
    const backendProjectId = backendUrl?.split('//')[1]?.split('.')[0];
    const frontendProjectId = frontendUrl?.split('//')[1]?.split('.')[0];
    
    console.log('📊 ÉTAT ACTUEL:');
    console.log(`   Backend (.env):        ${backendProjectId} (${backendUrl})`);
    console.log(`   Frontend (.env.local): ${frontendProjectId} (${frontendUrl})`);
    
    if (backendProjectId === frontendProjectId) {
      console.log('✅ Les configurations sont cohérentes');
      console.log('\n🔄 Si vous voyez encore les anciennes données, c\'est un problème de cache.');
      console.log('\n💡 SOLUTIONS POUR LE CACHE:');
      console.log('1. Redémarrez les deux serveurs (backend ET frontend)');
      console.log('2. Videz le cache du navigateur (Ctrl+Shift+R)');
      console.log('3. Utilisez le mode incognito');
      console.log('4. Vérifiez le localStorage du navigateur');
      
      return;
    }
    
    console.log('❌ INCOHÉRENCE DÉTECTÉE !');
    console.log('\n🎯 QUELLE BASE VOULEZ-VOUS UTILISER ?');
    console.log(`   Option 1: ${backendProjectId} (actuellement backend)`);
    console.log(`   Option 2: ${frontendProjectId} (actuellement frontend)`);
    
    // Proposer des solutions
    console.log('\n💡 SOLUTIONS:');
    console.log('\n🔧 OPTION A: Utiliser la base du FRONTEND partout');
    console.log('   (Recommandé si c\'est votre nouvelle base vide)');
    console.log('   → Mettre à jour backend/.env pour utiliser:', frontendProjectId);
    
    console.log('\n🔧 OPTION B: Utiliser la base du BACKEND partout');
    console.log('   (Recommandé si c\'est votre base avec les données)');
    console.log('   → Mettre à jour frontend/.env.local pour utiliser:', backendProjectId);
    
    // Créer les fichiers de correction
    console.log('\n📝 CRÉATION DES SCRIPTS DE CORRECTION...');
    
    // Script pour utiliser la base frontend partout
    const useNewDatabase = `# Utiliser la nouvelle base (${frontendProjectId}) partout
# Remplacez le contenu de backend/.env par:

SUPABASE_URL=${frontendUrl}
SUPABASE_SERVICE_ROLE_KEY=VOTRE_SERVICE_ROLE_KEY_POUR_${frontendProjectId}

# Note: Vous devez récupérer la SERVICE_ROLE_KEY depuis votre dashboard Supabase
# Dashboard: https://supabase.com/dashboard/project/${frontendProjectId}
# Allez dans Settings > API > service_role key
`;
    
    writeFileSync('use-new-database.txt', useNewDatabase);
    
    // Script pour utiliser l'ancienne base partout
    const useOldDatabase = `# Utiliser l'ancienne base (${backendProjectId}) partout
# Remplacez les lignes actives dans frontend/.env.local par:

NEXT_PUBLIC_SUPABASE_URL=${backendUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=VOTRE_ANON_KEY_POUR_${backendProjectId}
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=VOTRE_PUBLISHABLE_KEY_POUR_${backendProjectId}

# Note: Vous devez récupérer les clés depuis votre dashboard Supabase
# Dashboard: https://supabase.com/dashboard/project/${backendProjectId}
# Allez dans Settings > API
`;
    
    writeFileSync('use-old-database.txt', useOldDatabase);
    
    console.log('✅ Fichiers créés:');
    console.log('   - use-new-database.txt (pour utiliser la nouvelle base partout)');
    console.log('   - use-old-database.txt (pour utiliser l\'ancienne base partout)');
    
    // Vérifier si on peut détecter quelle base a des données
    console.log('\n🔍 RECOMMANDATION:');
    
    if (frontendProjectId === 'szgodrjglbpzkrksnroi') {
      console.log('📋 Vous semblez vouloir utiliser une NOUVELLE base de données.');
      console.log('   → Utilisez use-new-database.txt pour mettre à jour le backend');
      console.log('   → Puis exécutez le script de déploiement pour créer les données');
      console.log('   → Commande: bun run deploy-complete-system.ts');
    } else {
      console.log('📋 Configuration non standard détectée.');
      console.log('   → Choisissez manuellement quelle base utiliser');
    }
    
    console.log('\n🚀 ÉTAPES SUIVANTES:');
    console.log('1. Choisissez quelle base utiliser');
    console.log('2. Mettez à jour les fichiers .env selon votre choix');
    console.log('3. Redémarrez les deux serveurs');
    console.log('4. Si nouvelle base: exécutez le déploiement complet');
    console.log('5. Testez la connexion');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixDatabaseMismatch();