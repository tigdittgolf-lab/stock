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
    console.log('🔍 Récupération des utilisateurs pour admin');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération utilisateurs:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log('✅ Utilisateurs récupérés:', data?.length || 0);
    
    return NextResponse.json({
      success: true,
      data: data || [],
      debug: {
        count: data?.length || 0,
        method: 'direct_table_access'
      }
    });

  } catch (error) {
    console.error('❌ Erreur serveur admin users:', error);
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
    console.log('🔍 Création nouvel utilisateur:', { ...body, password: '***' });

    // Validation des champs requis
    if (!body.username || !body.email || !body.password) {
      return NextResponse.json({
        success: false,
        error: 'Username, email et password sont requis'
      }, { status: 400 });
    }

    // Hasher le mot de passe (simple hash pour l'instant)
    // TODO: Utiliser bcrypt pour un hash plus sécurisé en production
    const crypto = require('crypto');
    const password_hash = crypto
      .createHash('sha256')
      .update(body.password)
      .digest('hex');

    // Préparer les données pour l'insertion
    const userData = {
      username: body.username,
      email: body.email,
      password_hash: password_hash, // Utiliser password_hash au lieu de password
      full_name: body.full_name || '',
      role: body.role || 'user',
      business_units: body.business_units || [],
      active: true
    };

    console.log('📝 Données utilisateur préparées:', { ...userData, password_hash: '***' });

    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur création utilisateur:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }

    console.log('✅ Utilisateur créé:', data);
    
    return NextResponse.json({
      success: true,
      data: data,
      message: 'Utilisateur créé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur création utilisateur:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}