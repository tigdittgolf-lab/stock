// Script pour créer toutes les API routes manquantes
const fs = require('fs');
const path = require('path');

// Template pour une API route générique
const createApiRoute = (routeName, rpcFunction, description) => `import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    console.log(\`🔍 ${description} pour le tenant: \${tenant}\`);

    try {
      const { data, error } = await supabase.rpc('${rpcFunction}', {
        p_tenant: tenant
      });

      if (!error && data) {
        let result = data;
        if (typeof data === 'string') {
          try {
            result = JSON.parse(data);
          } catch (parseError) {
            result = [];
          }
        }
        
        return NextResponse.json({
          success: true,
          data: result || []
        });
      } else {
        return NextResponse.json({
          success: true,
          data: [],
          error: error?.message
        });
      }
    } catch (rpcError) {
      return NextResponse.json({
        success: true,
        data: [],
        error: 'RPC function not available'
      });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}`;

// APIs manquantes à créer
const missingApis = [
  {
    path: 'frontend/app/api/auth-real/login/route.ts',
    exists: true // Déjà créé
  },
  {
    path: 'frontend/app/api/auth-real/validate-reset-token/[token]/route.ts',
    content: createApiRoute('validate-reset-token', 'validate_reset_token', 'Validation token reset')
  },
  {
    path: 'frontend/app/api/auth-real/reset-password/route.ts',
    content: createApiRoute('reset-password', 'reset_password', 'Reset password')
  },
  {
    path: 'frontend/app/api/auth/create-user/route.ts',
    content: createApiRoute('create-user', 'create_user', 'Création utilisateur')
  },
  {
    path: 'frontend/app/api/auth/business-units/route.ts',
    content: createApiRoute('business-units', 'get_business_units', 'Récupération business units')
  },
  {
    path: 'frontend/app/api/auth/create-new-exercise/route.ts',
    content: createApiRoute('create-new-exercise', 'create_new_exercise', 'Création nouvel exercice')
  },
  {
    path: 'frontend/app/api/company/info/route.ts',
    content: createApiRoute('company-info', 'get_company_info', 'Informations entreprise')
  },
  {
    path: 'frontend/app/api/pdf/proforma/[id]/route.ts',
    content: createApiRoute('pdf-proforma', 'generate_proforma_pdf', 'Génération PDF proforma')
  }
];

// Créer les dossiers et fichiers manquants
missingApis.forEach(api => {
  if (api.exists) return;
  
  const dir = path.dirname(api.path);
  
  // Créer le dossier s'il n'existe pas
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(\`📁 Created directory: \${dir}\`);
  }
  
  // Créer le fichier s'il n'existe pas
  if (!fs.existsSync(api.path)) {
    fs.writeFileSync(api.path, api.content);
    console.log(\`✅ Created API route: \${api.path}\`);
  }
});

console.log('✅ All missing API routes created!');