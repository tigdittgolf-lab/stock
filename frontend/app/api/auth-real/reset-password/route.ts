import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;
    
    console.log(`🔍 Reset password avec token`);

    try {
      const { data, error } = await supabase.rpc('reset_password', {
        p_token: token,
        p_new_password: newPassword
      });

      if (!error) {
        return NextResponse.json({
          success: true,
          message: 'Mot de passe réinitialisé avec succès'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 400 });
      }
    } catch (rpcError) {
      return NextResponse.json({
        success: false,
        error: 'Service de reset non disponible'
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}