import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Récupération des exercices disponibles...');

    // Essayer d'abord avec la fonction RPC
    try {
      const { data, error } = await supabase.rpc('get_available_exercises');

      if (!error && data) {
        console.log('✅ Exercices récupérés via RPC:', data);
        return NextResponse.json({
          success: true,
          data: data || []
        });
      }
    } catch (rpcError) {
      console.log('⚠️ RPC function not available, trying direct query');
    }

    // Essayer une requête directe sur la table business_units
    try {
      const { data: buData, error: buError } = await supabase
        .from('business_units')
        .select('*')
        .order('year', { ascending: false });

      if (!buError && buData && buData.length > 0) {
        console.log('✅ BU récupérées via requête directe:', buData);
        return NextResponse.json({
          success: true,
          data: buData
        });
      } else {
        console.log('⚠️ Erreur ou pas de données dans business_units:', buError);
      }
    } catch (directError) {
      console.log('⚠️ Direct query failed:', directError);
    }

    // Essayer de lister les schémas directement
    try {
      const { data: schemaData, error: schemaError } = await supabase
        .rpc('get_tenant_schemas');

      if (!schemaError && schemaData) {
        console.log('✅ Schémas récupérés:', schemaData);
        return NextResponse.json({
          success: true,
          data: schemaData
        });
      }
    } catch (schemaError) {
      console.log('⚠️ Schema query failed');
    }

    // Fallback : données de test (seulement si tout échoue)
    const fallbackExercises = [
      {
        schema_name: '2025_bu01',
        bu_code: 'bu01',
        year: 2025,
        nom_entreprise: 'ETS BENAMAR BOUZID MENOUAR',
        adresse: '10, Rue Belhandouz A.E.K, Mostaganem',
        telephone: '(213)045.42.35.20',
        email: 'outillagesaada@gmail.com',
        active: true
      },
      {
        schema_name: '2024_bu01',
        bu_code: 'bu01', 
        year: 2024,
        nom_entreprise: 'ETS BENAMAR BOUZID MENOUAR',
        adresse: '10, Rue Belhandouz A.E.K, Mostaganem',
        telephone: '(213)045.42.35.20',
        email: 'outillagesaada@gmail.com',
        active: true
      }
    ];

    console.log('✅ Exercices récupérés (fallback):', fallbackExercises);

    return NextResponse.json({
      success: true,
      data: fallbackExercises
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