import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const tenant = '2025_bu01';
    console.log(`🔍 Test de tous les documents pour le tenant: ${tenant}`);

    const results: any = {
      tenant: tenant,
      supabaseUrl: supabaseUrl,
      documents: {}
    };

    // Test BL Vente
    try {
      const { data, error } = await supabase.rpc('get_delivery_notes', { p_tenant: tenant });
      results.documents.bl_vente = {
        success: !error,
        error: error?.message,
        count: data ? (Array.isArray(data) ? data.length : (typeof data === 'string' ? JSON.parse(data).length : 0)) : 0,
        data: data
      };
    } catch (error) {
      results.documents.bl_vente = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0
      };
    }

    // Test Factures Vente
    try {
      const { data, error } = await supabase.rpc('get_invoices', { p_tenant: tenant });
      results.documents.factures_vente = {
        success: !error,
        error: error?.message,
        count: data ? (Array.isArray(data) ? data.length : (typeof data === 'string' ? JSON.parse(data).length : 0)) : 0,
        data: data
      };
    } catch (error) {
      results.documents.factures_vente = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0
      };
    }

    // Test Proformas
    try {
      const { data, error } = await supabase.rpc('get_proformas', { p_tenant: tenant });
      results.documents.proformas = {
        success: !error,
        error: error?.message,
        count: data ? (Array.isArray(data) ? data.length : (typeof data === 'string' ? JSON.parse(data).length : 0)) : 0,
        data: data
      };
    } catch (error) {
      results.documents.proformas = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0
      };
    }

    // Test BL Achat
    try {
      const { data, error } = await supabase.rpc('get_purchase_delivery_notes', { p_tenant: tenant });
      results.documents.bl_achat = {
        success: !error,
        error: error?.message,
        count: data ? (Array.isArray(data) ? data.length : (typeof data === 'string' ? JSON.parse(data).length : 0)) : 0,
        data: data
      };
    } catch (error) {
      results.documents.bl_achat = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0
      };
    }

    // Test Factures Achat
    try {
      const { data, error } = await supabase.rpc('get_purchase_invoices', { p_tenant: tenant });
      results.documents.factures_achat = {
        success: !error,
        error: error?.message,
        count: data ? (Array.isArray(data) ? data.length : (typeof data === 'string' ? JSON.parse(data).length : 0)) : 0,
        data: data
      };
    } catch (error) {
      results.documents.factures_achat = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Test de tous les documents terminé',
      results: results
    });

  } catch (error) {
    console.error('❌ Erreur test documents:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur test documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}