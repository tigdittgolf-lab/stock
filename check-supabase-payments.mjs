// Vérifier où se trouve la table payments dans Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSupabasePayments() {
  try {
    console.log('🔍 Recherche de la table payments dans Supabase...\n');

    // Chercher dans information_schema
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT table_schema, table_name 
          FROM information_schema.tables 
          WHERE table_name = 'payments'
          ORDER BY table_schema
        `
      });

    if (tablesError) {
      console.log('⚠️ Fonction exec_sql non disponible, essayons autrement...\n');
      
      // Essayer de lire directement depuis public.payments
      const { data: publicPayments, error: publicError } = await supabase
        .from('payments')
        .select('*')
        .limit(1);

      if (!publicError) {
        console.log('✅ Table payments trouvée dans le schéma PUBLIC');
        
        // Compter les paiements
        const { count } = await supabase
          .from('payments')
          .select('*', { count: 'exact', head: true });
        
        console.log(`📊 Nombre de paiements: ${count}\n`);
        
        if (count > 0) {
          const { data: sample } = await supabase
            .from('payments')
            .select('*')
            .limit(3);
          
          console.log('📋 Exemples de paiements:');
          console.table(sample);
        }
      } else {
        console.log('❌ Table payments NON TROUVÉE dans public');
        console.log('Erreur:', publicError.message);
        console.log('\n💡 La table payments doit être créée dans Supabase');
        console.log('📝 Utilisez: backend/migrations/create_payments_table_supabase.sql');
      }
    } else {
      console.log('📊 Tables "payments" trouvées:');
      console.table(tables);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkSupabasePayments();
