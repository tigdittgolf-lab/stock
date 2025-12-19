import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../lib/database/database-service';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = DatabaseService.getActiveDatabaseType();
    
    console.log(`🔍 Récupération des articles pour le tenant: ${tenant} (DB: ${dbType})`);

    // Utiliser le service de base de données unifié
    const result = await DatabaseService.executeRPC('get_articles', {
      p_tenant: tenant
    });

    console.log(`📊 Résultat ${dbType} get_articles:`, { 
      success: result.success,
      dataType: typeof result.data,
      dataLength: Array.isArray(result.data) ? result.data.length : 0,
      tenant: tenant 
    });

    if (result.success && result.data) {
      // Parse JSON if it's a string (Supabase case)
      let articles = result.data;
      if (typeof result.data === 'string') {
        try {
          articles = JSON.parse(result.data);
        } catch (parseError) {
          console.log('⚠️ Failed to parse JSON:', parseError);
          articles = [];
        }
      }
      
      console.log(`✅ Articles récupérés via ${dbType}:`, articles?.length || 0);
      return NextResponse.json({
        success: true,
        data: articles || [],
        debug: {
          tenant: tenant,
          method: 'database_service',
          database_type: dbType,
          function: 'get_articles',
          dataType: typeof result.data,
          originalData: result.data
        }
      });
    } else {
      console.log(`❌ Erreur ${dbType}:`, result.error);
      return NextResponse.json({
        success: true,
        data: [],
        debug: {
          tenant: tenant,
          database_type: dbType,
          error: result.error,
          function: 'get_articles',
          suggestion: `Vérifiez que la fonction/table get_articles existe dans ${dbType}`
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