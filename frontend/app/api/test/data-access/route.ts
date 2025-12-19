import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const tenant = '2025_bu01'; // Test avec votre schéma
    console.log(`🔍 Test d'accès aux données pour le tenant: ${tenant}`);

    const results: any = {
      tenant: tenant,
      supabaseUrl: supabaseUrl,
      tests: {}
    };

    // Test 1: Articles
    try {
      const { data: articlesData, error: articlesError } = await supabase.rpc('get_articles', {
        p_tenant: tenant
      });
      
      results.tests.articles = {
        success: !articlesError,
        error: articlesError?.message,
        count: articlesData ? (Array.isArray(articlesData) ? articlesData.length : (typeof articlesData === 'string' ? JSON.parse(articlesData).length : 0)) : 0,
        data: articlesData
      };
    } catch (error) {
      results.tests.articles = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0
      };
    }

    // Test 2: Clients
    try {
      const { data: clientsData, error: clientsError } = await supabase.rpc('get_clients', {
        p_tenant: tenant
      });
      
      results.tests.clients = {
        success: !clientsError,
        error: clientsError?.message,
        count: clientsData ? (Array.isArray(clientsData) ? clientsData.length : (typeof clientsData === 'string' ? JSON.parse(clientsData).length : 0)) : 0,
        data: clientsData
      };
    } catch (error) {
      results.tests.clients = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0
      };
    }

    // Test 3: Fournisseurs
    try {
      const { data: suppliersData, error: suppliersError } = await supabase.rpc('get_suppliers', {
        p_tenant: tenant
      });
      
      results.tests.suppliers = {
        success: !suppliersError,
        error: suppliersError?.message,
        count: suppliersData ? (Array.isArray(suppliersData) ? suppliersData.length : (typeof suppliersData === 'string' ? JSON.parse(suppliersData).length : 0)) : 0,
        data: suppliersData
      };
    } catch (error) {
      results.tests.suppliers = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0
      };
    }

    // Test 4: Accès direct au schéma (pour comparaison)
    try {
      const { data: directData, error: directError } = await supabase
        .from(`${tenant}.article`)
        .select('*')
        .limit(5);
      
      results.tests.direct_access = {
        success: !directError,
        error: directError?.message,
        count: directData?.length || 0,
        note: 'Accès direct au schéma (peut ne pas fonctionner)'
      };
    } catch (error) {
      results.tests.direct_access = {
        success: false,
        error: error instanceof Error ? error.message : 'Direct access not supported',
        count: 0
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Test d\'accès aux données terminé',
      results: results
    });

  } catch (error) {
    console.error('❌ Erreur test:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}