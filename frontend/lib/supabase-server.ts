import { createClient } from '@supabase/supabase-js';

// Variables d'environnement avec fallback
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

// Client Supabase pour le serveur (avec service role key)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Fonction helper pour vérifier si Supabase est configuré
export function isSupabaseConfigured(): boolean {
  return !!supabaseAdmin;
}

// Export des valeurs pour usage direct si nécessaire
export { supabaseUrl, supabaseServiceKey };
