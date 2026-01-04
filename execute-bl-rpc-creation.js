// Script pour créer les fonctions RPC manquantes dans Supabase
const fs = require('fs');

console.log('🔧 CRÉATION DES FONCTIONS RPC BL MANQUANTES\n');

// Lire le fichier SQL
const sqlContent = fs.readFileSync('CREATE_COMPLETE_BL_RPC_FUNCTIONS.sql', 'utf8');

console.log('📋 FONCTIONS À CRÉER DANS SUPABASE:');
console.log('1. get_bl_details_by_id - Récupère les détails des articles d\'un BL');
console.log('2. get_bl_complete_by_id - Récupère un BL complet avec détails et client');
console.log('3. get_bl_client_info - Récupère les informations client d\'un BL');

console.log('\n📝 INSTRUCTIONS:');
console.log('1. Aller sur https://supabase.com/dashboard');
console.log('2. Ouvrir votre projet Supabase');
console.log('3. Aller dans "SQL Editor"');
console.log('4. Coller le contenu du fichier CREATE_COMPLETE_BL_RPC_FUNCTIONS.sql');
console.log('5. Exécuter le script SQL');

console.log('\n🎯 RÉSULTAT ATTENDU:');
console.log('✅ Les fonctions RPC seront créées');
console.log('✅ Les détails des BL s\'afficheront correctement');
console.log('✅ Les pages de détails fonctionneront');
console.log('✅ Les PDF auront les informations complètes');

console.log('\n📄 CONTENU SQL À EXÉCUTER:');
console.log('─'.repeat(50));
console.log(sqlContent);
console.log('─'.repeat(50));

console.log('\n🚀 APRÈS EXÉCUTION:');
console.log('Les erreurs "Could not find the function" disparaîtront');
console.log('L\'interface mobile affichera tous les détails des BL');
console.log('Votre ami pourra voir le breakdown complet des articles');