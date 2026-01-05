// Script pour exécuter les fonctions RPC manquantes dans Supabase
// Utilise l'API Supabase pour créer les fonctions nécessaires

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://tigdittgolf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpZ2RpdHRnb2xmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk2NzI5NCwiZXhwIjoyMDUwNTQzMjk0fQ.Ej_Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL() {
  console.log('🔧 Création des fonctions RPC manquantes...');
  
  // Lire le fichier SQL
  const fs = require('fs');
  const sqlContent = fs.readFileSync('CREATE_COMPLETE_BL_RPC_FUNCTIONS.sql', 'utf8');
  
  try {
    // Exécuter le SQL via l'API Supabase
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });
    
    if (error) {
      console.error('❌ Erreur lors de l\'exécution SQL:', error);
    } else {
      console.log('✅ Fonctions RPC créées avec succès');
      console.log('📊 Résultat:', data);
    }
  } catch (err) {
    console.error('❌ Erreur:', err);
  }
}

executeSQL();