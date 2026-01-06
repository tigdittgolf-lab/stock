#!/usr/bin/env node

/**
 * Script d'aide pour corriger le problème BL ID
 * 
 * PROBLÈME: Cliquer sur n'importe quel BL affiche toujours BL 5
 * CAUSE: Fonctions RPC Supabase manquantes
 * SOLUTION: Exécuter le script SQL dans Supabase
 */

const fs = require('fs');
const path = require('path');

console.log('🚨 CORRECTION URGENTE: Problème BL ID');
console.log('=====================================');
console.log('');

console.log('❌ PROBLÈME IDENTIFIÉ:');
console.log('   • Vous cliquez sur BL 1, 4, etc. mais voyez toujours BL 5');
console.log('   • Les fonctions RPC Supabase sont manquantes');
console.log('   • Le backend utilise des données mock (toujours BL 5)');
console.log('');

console.log('✅ SOLUTION:');
console.log('   1. Ouvrir Supabase SQL Editor');
console.log('   2. Exécuter le script CREATE_COMPLETE_BL_RPC_FUNCTIONS.sql');
console.log('   3. Redémarrer le backend');
console.log('');

// Vérifier si le fichier SQL existe
const sqlFile = 'CREATE_COMPLETE_BL_RPC_FUNCTIONS.sql';
if (fs.existsSync(sqlFile)) {
    console.log('📄 SCRIPT SQL TROUVÉ:');
    console.log(`   • Fichier: ${sqlFile}`);
    
    // Lire le contenu du fichier
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    const lines = sqlContent.split('\n').length;
    const functions = (sqlContent.match(/CREATE OR REPLACE FUNCTION/g) || []).length;
    
    console.log(`   • Lignes: ${lines}`);
    console.log(`   • Fonctions RPC: ${functions}`);
    console.log('');
    
    console.log('📋 INSTRUCTIONS DÉTAILLÉES:');
    console.log('');
    console.log('1. SUPABASE:');
    console.log('   • Allez sur https://supabase.com');
    console.log('   • Connectez-vous à votre projet');
    console.log('   • Cliquez sur "SQL Editor"');
    console.log('   • Copiez TOUT le contenu de CREATE_COMPLETE_BL_RPC_FUNCTIONS.sql');
    console.log('   • Collez dans l\'éditeur SQL');
    console.log('   • Cliquez "Run" pour exécuter');
    console.log('');
    
    console.log('2. BACKEND:');
    console.log('   • Arrêtez le backend (Ctrl+C)');
    console.log('   • Relancez: npm run dev');
    console.log('');
    
    console.log('3. TEST:');
    console.log('   • Allez sur votre app web');
    console.log('   • Cliquez sur un BL spécifique');
    console.log('   • Vérifiez que vous voyez les VRAIES données');
    console.log('');
    
    console.log('🔍 LOGS À SURVEILLER:');
    console.log('   ✅ "Found BL X basic info" (avec le bon numéro)');
    console.log('   ✅ "Retrieved complete BL data X" (avec le bon numéro)');
    console.log('   ❌ Plus de "using mock data"');
    console.log('');
    
} else {
    console.log('❌ ERREUR: Fichier SQL non trouvé');
    console.log(`   • Recherché: ${sqlFile}`);
    console.log('   • Vérifiez que vous êtes dans le bon répertoire');
    console.log('');
}

console.log('⚠️  IMPORTANT:');
console.log('   Ce problème empêche l\'utilisation normale de l\'application.');
console.log('   Il faut le corriger en priorité absolue.');
console.log('');

console.log('📞 AIDE:');
console.log('   Si le problème persiste après ces étapes:');
console.log('   1. Vérifiez que les fonctions RPC sont créées dans Supabase');
console.log('   2. Redémarrez complètement le backend');
console.log('   3. Videz le cache du navigateur (Ctrl+F5)');
console.log('');

console.log('🎯 OBJECTIF:');
console.log('   Après correction: BL 1 → données BL 1, BL 4 → données BL 4');
console.log('');