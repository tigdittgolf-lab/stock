import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    console.log(`🔐 Tentative de connexion: ${username}`);

    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Username et password requis' 
      }, { status: 400 });
    }

    // Authentifier via RPC
    const { data, error } = await supabase.rpc('authenticate_user', {
      p_username: username,
      p_password: password
    });

    if (error) {
      console.error('❌ RPC Error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erreur lors de l\'authentification' 
      }, { status: 500 });
    }

    // Parser la réponse JSON
    const authResult = typeof data === 'string' ? JSON.parse(data) : data;

    if (!authResult.success) {
      console.log(`❌ Authentification échouée: ${authResult.error}`);
      return NextResponse.json({ 
        success: false, 
        error: authResult.error 
      }, { status: 401 });
    }

    console.log(`✅ Authentification réussie: ${authResult.user.username}`);

    // Générer un token JWT simple (pour la démo)
    const token = Buffer.from(JSON.stringify({
      userId: authResult.user.id,
      username: authResult.user.username,
      role: authResult.user.role,
      timestamp: Date.now()
    })).toString('base64');

    return NextResponse.json({
      success: true,
      message: 'Authentification réussie',
      token,
      user: authResult.user
    });

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}