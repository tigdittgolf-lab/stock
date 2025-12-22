import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { DatabaseConfig } from '../../../../lib/database/types';

export async function POST(request: NextRequest) {
  let client: Client | null = null;
  
  try {
    const body = await request.json();
    const { config, sql, params }: {
      config: DatabaseConfig;
      sql: string;
      params?: any[];
    } = body;

    console.log('🔄 Requête PostgreSQL:', {
      host: config.host,
      database: config.database,
      sql: sql.substring(0, 100)
    });

    // Créer le client PostgreSQL
    client = new Client({
      host: config.host || 'localhost',
      port: config.port || 5432,
      user: config.username || 'postgres',
      password: config.password || '',
      database: config.database || 'postgres'
    });

    // Se connecter
    await client.connect();
    console.log('✅ Connexion PostgreSQL établie');

    // Exécuter la requête
    const result = await client.query(sql, params || []);
    
    console.log('✅ Requête PostgreSQL exécutée:', result.rows.length, 'résultats');

    return NextResponse.json({
      success: true,
      data: result.rows,
      rowCount: result.rowCount || result.rows.length
    });

  } catch (error) {
    console.error('❌ Erreur PostgreSQL:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur PostgreSQL inconnue'
    }, { status: 500 });
  } finally {
    // Fermer la connexion
    if (client) {
      try {
        await client.end();
        console.log('🔌 Connexion PostgreSQL fermée');
      } catch (closeError) {
        console.error('⚠️ Erreur fermeture connexion PostgreSQL:', closeError);
      }
    }
  }
}