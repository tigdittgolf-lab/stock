import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Récupération des statistiques admin');

    // Récupérer les statistiques de base
    const [businessUnitsResult, usersResult] = await Promise.all([
      supabase.from('business_units').select('*', { count: 'exact' }),
      supabase.from('users').select('*', { count: 'exact' })
    ]);

    const stats = {
      business_units: {
        total: businessUnitsResult.count || 0,
        active: businessUnitsResult.data?.filter(bu => bu.is_active)?.length || 0
      },
      users: {
        total: usersResult.count || 0,
        active: usersResult.data?.filter(user => user.is_active)?.length || 0
      },
      system: {
        last_updated: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    console.log('✅ Statistiques récupérées:', stats);
    
    return NextResponse.json({
      success: true,
      data: stats,
      debug: {
        timestamp: new Date().toISOString(),
        method: 'aggregated_stats'
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}