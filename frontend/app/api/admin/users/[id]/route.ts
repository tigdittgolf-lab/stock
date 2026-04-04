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

// GET - Récupérer un utilisateur par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return NextResponse.json({
        success: false,
        error: 'ID utilisateur invalide'
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Erreur récupération utilisateur:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// PUT - Mettre à jour un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return NextResponse.json({
        success: false,
        error: 'ID utilisateur invalide'
      }, { status: 400 });
    }

    const body = await request.json();
    console.log('🔄 Mise à jour utilisateur:', userId, { ...body, password: body.password ? '***' : undefined });

    // Préparer les données de mise à jour
    const updateData: any = {
      username: body.username,
      email: body.email,
      full_name: body.full_name,
      role: body.role,
      business_units: body.business_units,
      active: body.active,
      updated_at: new Date().toISOString()
    };

    // Si un nouveau mot de passe est fourni, le hasher
    if (body.password && body.password.trim() !== '') {
      const crypto = require('crypto');
      updateData.password_hash = crypto
        .createHash('sha256')
        .update(body.password)
        .digest('hex');
      console.log('🔐 Nouveau mot de passe hashé');
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour utilisateur:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }

    console.log('✅ Utilisateur mis à jour:', data);
    
    return NextResponse.json({
      success: true,
      data: data,
      message: 'Utilisateur mis à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour utilisateur:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return NextResponse.json({
        success: false,
        error: 'ID utilisateur invalide'
      }, { status: 400 });
    }

    console.log('🗑️ Suppression utilisateur:', userId);

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('❌ Erreur suppression utilisateur:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }

    console.log('✅ Utilisateur supprimé:', userId);
    
    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression utilisateur:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}
