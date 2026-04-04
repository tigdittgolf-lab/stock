import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}
const supabase = { get: getSupabase };

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Récupération des business units pour admin');

    // Récupérer toutes les business units
    const { data: businessUnits, error } = await supabase
      .from('business_units')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération BU:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // Pour chaque BU, récupérer les données de la table activite
    const enrichedBUs = await Promise.all(
      (businessUnits || []).map(async (bu) => {
        try {
          const { data: activiteData } = await supabase.rpc('get_tenant_activite', {
            p_tenant: bu.schema_name
          });

          return {
            ...bu,
            // Fusionner les données de la table activite
            nom_entreprise: activiteData?.nom_entreprise || bu.nom_entreprise || '',
            adresse: activiteData?.adresse || '',
            commune: activiteData?.commune || '',
            wilaya: activiteData?.wilaya || '',
            telephone: activiteData?.telephone || activiteData?.tel_fixe || '',
            tel_port: activiteData?.tel_port || '',
            email: activiteData?.email || activiteData?.e_mail || '',
            nif: activiteData?.nif || '',
            ident_fiscal: activiteData?.ident_fiscal || '',
            rc: activiteData?.rc || '',
            nrc: activiteData?.nrc || '',
            nart: activiteData?.nart || '',
            banq: activiteData?.banq || '',
            activite: activiteData?.activite || activiteData?.sous_domaine || activiteData?.domaine_activite || '',
            slogan: activiteData?.slogan || ''
          };
        } catch (err) {
          console.log(`⚠️ Erreur récupération activite pour ${bu.schema_name}:`, err);
          return bu; // Retourner les données de base si erreur
        }
      })
    );

    console.log('✅ Business units enrichies récupérées:', enrichedBUs?.length || 0);
    
    return NextResponse.json({
      success: true,
      data: enrichedBUs || [],
      debug: {
        count: enrichedBUs?.length || 0,
        method: 'enriched_with_activite_data'
      }
    });

  } catch (error) {
    console.error('❌ Erreur serveur admin BU:', error);
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
    console.log('🔍 Création nouvelle BU:', body);

    const { data, error } = await supabase
      .from('business_units')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur création BU:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }

    console.log('✅ BU créée:', data);
    
    return NextResponse.json({
      success: true,
      data: data,
      message: 'Business unit créée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur création BU:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { schema_name, ...updateData } = body;
    
    console.log('🔍 Mise à jour BU:', schema_name, updateData);

    // Mettre à jour la table business_units
    const { data: buData, error: buError } = await supabase
      .from('business_units')
      .update({
        bu_code: updateData.bu_code,
        year: updateData.year,
        active: updateData.active
      })
      .eq('schema_name', schema_name)
      .select()
      .single();

    if (buError) {
      console.error('❌ Erreur mise à jour table business_units:', buError);
      return NextResponse.json({
        success: false,
        error: buError.message
      }, { status: 400 });
    }

    // Mettre à jour la table activite via RPC
    try {
      const activiteData = {
        nom_entreprise: updateData.nom_entreprise,
        adresse: updateData.adresse,
        commune: updateData.commune,
        wilaya: updateData.wilaya,
        telephone: updateData.telephone,
        tel_port: updateData.tel_port,
        email: updateData.email,
        nif: updateData.nif,
        ident_fiscal: updateData.ident_fiscal,
        rc: updateData.rc,
        nrc: updateData.nrc,
        nart: updateData.nart,
        banq: updateData.banq,
        activite: updateData.activite,
        slogan: updateData.slogan
      };

      const { data: rpcData, error: rpcError } = await supabase.rpc('update_tenant_activite', {
        p_tenant: schema_name,
        p_data: activiteData
      });

      if (rpcError) {
        console.log('⚠️ Erreur mise à jour activite (non critique):', rpcError);
      } else {
        console.log('✅ Table activite mise à jour:', rpcData);
      }
    } catch (rpcErr) {
      console.log('⚠️ Exception RPC activite (non critique):', rpcErr);
    }

    console.log('✅ BU mise à jour:', buData);
    
    return NextResponse.json({
      success: true,
      data: { ...buData, ...updateData },
      message: 'Business unit mise à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour BU:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const schema = url.pathname.split('/').pop();
    
    console.log('🔍 Suppression BU:', schema);

    const { error } = await supabase
      .from('business_units')
      .delete()
      .eq('schema_name', schema);

    if (error) {
      console.error('❌ Erreur suppression BU:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }

    console.log('✅ BU supprimée:', schema);
    
    return NextResponse.json({
      success: true,
      message: 'Business unit supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression BU:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}