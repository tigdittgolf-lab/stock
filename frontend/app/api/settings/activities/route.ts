import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../lib/database/database-service';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = DatabaseService.getActiveDatabaseType();
    
    console.log(`🔍 Récupération activité pour le tenant: ${tenant} (DB: ${dbType})`);

    const result = await DatabaseService.executeRPC('get_tenant_activite', {
      p_tenant: tenant
    });

    console.log(`📊 Résultat ${dbType} get_tenant_activite:`, { 
      success: result.success,
      dataType: typeof result.data,
      tenant: tenant 
    });

    if (result.success && result.data) {
      let activity: any = result.data;
      if (typeof result.data === 'string') {
        try {
          activity = JSON.parse(result.data);
        } catch (parseError) {
          console.log('⚠️ Failed to parse JSON:', parseError);
          activity = null;
        }
      }
      
      console.log(`✅ Activité récupérée via ${dbType}`);
      return NextResponse.json({
        success: true,
        data: activity,
        debug: {
          tenant: tenant,
          method: 'database_service',
          database_type: dbType,
          function: 'get_tenant_activite'
        }
      });
    } else {
      console.log(`❌ Erreur ${dbType}:`, result.error);
      return NextResponse.json({
        success: true,
        data: null,
        debug: {
          tenant: tenant,
          database_type: dbType,
          error: result.error,
          function: 'get_tenant_activite'
        }
      });
    }

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const body = await request.json();
    const dbType = DatabaseService.getActiveDatabaseType();
    
    console.log(`🔍 Mise à jour activité pour le tenant: ${tenant} (DB: ${dbType})`, body);

    const result = await DatabaseService.executeRPC('update_tenant_activite', {
      p_tenant: tenant,
      p_data: body
    });

    console.log(`📊 Résultat ${dbType} update_tenant_activite:`, { 
      success: result.success,
      data: result.data,
      tenant: tenant,
      body: body
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Activité mise à jour avec succès',
        data: result.data,
        debug: {
          tenant: tenant,
          database_type: dbType,
          function: 'update_tenant_activite',
          input: body
        }
      });
    } else {
      console.log(`❌ Erreur ${dbType} update:`, result.error);
      return NextResponse.json({
        success: false,
        error: result.error || 'Erreur de mise à jour',
        debug: {
          tenant: tenant,
          database_type: dbType,
          function: 'update_tenant_activite',
          input: body,
          dbError: result.error
        }
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Erreur mise à jour activité:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}