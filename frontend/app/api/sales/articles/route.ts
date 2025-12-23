import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase pour la production
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Vérifier si les variables Supabase sont disponibles
if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Variables Supabase non configurées - Mode développement détecté');
}

// Créer le client Supabase seulement si les variables sont disponibles
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET(request: NextRequest) {
  try {
    // Si pas de Supabase configuré, rediriger vers le backend local
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Configuration Supabase manquante - Utiliser le backend local en développement'
      }, { status: 503 });
    }

    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    
    console.log(`🔍 Production API: Fetching articles for tenant ${tenant}`);
    
    const { data, error } = await supabase.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('❌ Production API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Si pas de Supabase configuré, rediriger vers le backend local
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Configuration Supabase manquante - Utiliser le backend local en développement'
      }, { status: 503 });
    }

    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const body = await request.json();
    
    console.log(`📝 Production API: Creating article for tenant ${tenant}`);
    
    const { data, error } = await supabase.rpc('insert_article_to_tenant', {
      p_tenant: tenant,
      ...body
    });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('❌ Production API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 });
  }
}