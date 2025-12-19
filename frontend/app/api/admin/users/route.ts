import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Récupération des utilisateurs pour admin');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération utilisateurs:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log('✅ Utilisateurs récupérés:', data?.length || 0);
    
    return NextResponse.json({
      success: true,
      data: data || [],
      debug: {
        count: data?.length || 0,
        method: 'direct_table_access'
      }
    });

  } catch (error) {
    console.error('❌ Erreur serveur admin users:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 Création nouvel utilisateur:', body);

    const { data, error } = await supabase
      .from('users')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur création utilisateur:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }

    console.log('✅ Utilisateur créé:', data);
    
    return NextResponse.json({
      success: true,
      data: data,
      message: 'Utilisateur créé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur création utilisateur:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}