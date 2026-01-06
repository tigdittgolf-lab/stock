import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Configuration Supabase manquante'
      }, { status: 503 });
    }
    
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    
    console.log(`🔍 API: Fetching delivery notes for tenant ${tenant}`);
    
    const { data, error } = await supabase.rpc('get_bl_list_by_tenant', {
      p_tenant: tenant
    });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log(`✅ API: Found ${data?.length || 0} delivery notes`);

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Configuration Supabase manquante'
      }, { status: 503 });
    }
    
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const body = await request.json();
    
    console.log(`📝 API: Creating delivery note for tenant ${tenant}`);
    
    // Créer le BL
    const { data: blData, error: blError } = await supabase.rpc('insert_bl_to_tenant', {
      p_tenant: tenant,
      ...body.bl
    });

    if (blError) {
      console.error('❌ Supabase BL error:', blError);
      return NextResponse.json({
        success: false,
        error: blError.message
      }, { status: 500 });
    }

    // Créer les détails si fournis
    if (body.details && body.details.length > 0) {
      for (const detail of body.details) {
        const { error: detailError } = await supabase.rpc('insert_detail_bl_to_tenant', {
          p_tenant: tenant,
          ...detail
        });
        
        if (detailError) {
          console.warn('⚠️ Detail insertion error:', detailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: blData
    });

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 });
  }
}