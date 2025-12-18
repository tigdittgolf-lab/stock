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

    // Essayer d'abord avec la fonction RPC
    try {
      const { data, error } = await supabase.rpc('authenticate_user', {
        p_username: username,
        p_password: password
      });

      if (!error && data) {
        const authResult = typeof data === 'string' ? JSON.parse(data) : data;
        
        if (authResult.success) {
          console.log(`✅ Authentification RPC réussie: ${authResult.user.username}`);
          
          const token = Buffer.from(JSON.stringify({
            userId: authResult.user.id,
            username: authResult.user.username,
            role: authResult.user.role,
            timestamp: Date.now()
          })).toString('base64');

          // S'assurer que l'utilisateur a des business units
          if (!authResult.user.business_units || authResult.user.business_units.length === 0) {
            authResult.user.business_units = ['2025_bu01', '2024_bu01'];
          }

          return NextResponse.json({
            success: true,
            message: 'Authentification réussie',
            token,
            user: authResult.user
          });
        }
      }
    } catch (rpcError) {
      console.log('⚠️ RPC function not available, using direct query');
    }

    // Fallback : authentification directe avec les comptes de test
    const testUsers = [
      { id: 1, username: 'admin', password: 'admin123', role: 'admin', nom: 'Administrateur' },
      { id: 2, username: 'manager', password: 'manager123', role: 'manager', nom: 'Manager' },
      { id: 3, username: 'user', password: 'user123', role: 'user', nom: 'Utilisateur' }
    ];

    const user = testUsers.find(u => 
      (u.username === username || u.username === username) && u.password === password
    );

    if (!user) {
      console.log(`❌ Authentification échouée: utilisateur non trouvé`);
      return NextResponse.json({ 
        success: false, 
        error: 'Nom d\'utilisateur ou mot de passe incorrect' 
      }, { status: 401 });
    }

    console.log(`✅ Authentification réussie (fallback): ${user.username}`);

    // Générer un token JWT simple
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      username: user.username,
      role: user.role,
      timestamp: Date.now()
    })).toString('base64');

    // Récupérer les business units réelles depuis Supabase
    let userBusinessUnits: string[] = [];
    
    try {
      // Essayer de récupérer les BU depuis la table business_units
      const { data: buData, error: buError } = await supabase
        .from('business_units')
        .select('schema_name')
        .eq('active', true);

      if (!buError && buData && buData.length > 0) {
        userBusinessUnits = buData.map(bu => bu.schema_name);
        console.log('✅ BU récupérées depuis Supabase:', userBusinessUnits);
      } else {
        // Fallback si la requête échoue
        userBusinessUnits = ['2025_bu01', '2024_bu01'];
        console.log('⚠️ Utilisation des BU par défaut');
      }
    } catch (error) {
      userBusinessUnits = ['2025_bu01', '2024_bu01'];
      console.log('⚠️ Erreur lors de la récupération des BU, utilisation des valeurs par défaut');
    }

    return NextResponse.json({
      success: true,
      message: 'Authentification réussie',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        nom: user.nom,
        business_units: userBusinessUnits
      }
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