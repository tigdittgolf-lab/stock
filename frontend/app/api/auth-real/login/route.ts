import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: 'Username et password requis'
      }, { status: 400 });
    }

    // Comptes de test en dur (fallback)
    const testUsers = [
      { id: 1, username: 'admin', password: 'admin123', role: 'admin', nom: 'Administrateur', email: 'admin@stock.dz' },
      { id: 2, username: 'manager', password: 'manager123', role: 'manager', nom: 'Manager', email: 'manager@stock.dz' },
      { id: 3, username: 'user', password: 'user123', role: 'user', nom: 'Utilisateur', email: 'user@stock.dz' }
    ];

    // Vérifier les comptes de test
    const testUser = testUsers.find(u => 
      (u.username === username || u.email === username) && u.password === password
    );

    if (testUser) {
      // Générer un token simple (en production, utiliser JWT)
      const token = Buffer.from(`${testUser.username}:${Date.now()}`).toString('base64');

      // Récupérer les business units disponibles
      const { data: businessUnits, error: buError } = await supabase
        .from('business_units')
        .select('schema_name, bu_code, year, nom_entreprise')
        .eq('active', true)
        .order('year', { ascending: false });

      if (buError) {
        console.error('Error fetching business units:', buError);
      }

      return NextResponse.json({
        success: true,
        token: token,
        user: {
          id: testUser.id,
          username: testUser.username,
          email: testUser.email,
          nom: testUser.nom,
          role: testUser.role,
          business_units: businessUnits?.map(bu => bu.schema_name) || []
        },
        businessUnits: businessUnits || []
      });
    }

    // Si pas de compte de test trouvé
    return NextResponse.json({
      success: false,
      error: 'Identifiants incorrects'
    }, { status: 401 });

  } catch (error: any) {
    console.error('Error in login:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
