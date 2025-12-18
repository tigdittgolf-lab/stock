import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    console.log(`🔍 Récupération des articles pour le tenant: ${tenant}`);

    // Essayer avec la fonction RPC
    try {
      const { data, error } = await supabase.rpc('get_articles', {
        p_tenant: tenant
      });

      if (!error && data) {
        console.log(`✅ Articles récupérés via RPC:`, data.length);
        return NextResponse.json({
          success: true,
          data: data || []
        });
      }
    } catch (rpcError) {
      console.log('⚠️ RPC function not available, trying direct query');
    }

    // Requête directe sur le schéma tenant
    try {
      console.log(`🔍 Tentative de requête sur ${tenant}.article`);
      
      const { data: articleData, error: articleError } = await supabase
        .from(`${tenant}.article`)
        .select('*')
        .order('narticle');

      console.log(`📊 Résultat requête:`, { 
        error: articleError, 
        dataLength: articleData?.length || 0,
        tenant: tenant 
      });

      if (!articleError && articleData) {
        console.log(`✅ Articles récupérés via requête directe:`, articleData.length);
        return NextResponse.json({
          success: true,
          data: articleData,
          debug: {
            tenant: tenant,
            method: 'direct_query',
            table: `${tenant}.article`
          }
        });
      } else if (articleError) {
        console.log(`❌ Erreur de requête:`, articleError);
        return NextResponse.json({
          success: true,
          data: [],
          debug: {
            tenant: tenant,
            error: articleError.message,
            table: `${tenant}.article`,
            suggestion: 'Vérifiez que le schéma et la table existent'
          }
        });
      }
    } catch (directError) {
      console.log('⚠️ Direct query failed:', directError);
    }

    // Fallback : données vides
    console.log('⚠️ Aucune donnée trouvée, retour de tableau vide');
    return NextResponse.json({
      success: true,
      data: []
    });

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}