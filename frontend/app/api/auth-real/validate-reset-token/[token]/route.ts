import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}
const supabase = { get: getSupabase };

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;
    console.log(`🔍 Validation token reset: ${token}`);

    try {
      const { data, error } = await supabase.rpc('validate_reset_token', {
        p_token: token
      });

      if (!error && data) {
        return NextResponse.json({
          success: true,
          data: data
        });
      } else {
        return NextResponse.json({
          success: false,
          error: error?.message || 'Token invalide'
        }, { status: 400 });
      }
    } catch (rpcError) {
      return NextResponse.json({
        success: false,
        error: 'Service de validation non disponible'
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}