import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Récupération des exercices disponibles...');

    // Récupérer les exercices via RPC
    const { data, error } = await supabase.rpc('get_available_exercises');

    if (error) {
      console.error('❌ RPC Error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erreur lors de la récupération des exercices' 
      }, { status: 500 });
    }

    console.log('✅ Exercices récupérés:', data);

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}