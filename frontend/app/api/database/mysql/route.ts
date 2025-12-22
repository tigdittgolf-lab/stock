import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { DatabaseConfig } from '../../../../lib/database/types';

export async function POST(request: NextRequest) {
  let connection: mysql.Connection | null = null;
  
  try {
    const body = await request.json();
    const { config, sql, params }: {
      config: DatabaseConfig;
      sql: string;
      params?: any[];
    } = body;

    console.log('🔄 Requête MySQL:', {
      host: config.host,
      database: config.database,
      sql: sql.substring(0, 100)
    });

    // Créer la connexion MySQL
    connection = await mysql.createConnection({
      host: config.host || 'localhost',
      port: config.port || 3306,
      user: config.username || 'root',
      password: config.password || '',
      database: config.database,
      multipleStatements: true
    });

    console.log('✅ Connexion MySQL établie');

    // Exécuter la requête
    const [rows, fields] = await connection.execute(sql, params || []);
    
    console.log('✅ Requête MySQL exécutée:', Array.isArray(rows) ? rows.length : 0, 'résultats');

    return NextResponse.json({
      success: true,
      data: rows,
      rowCount: Array.isArray(rows) ? rows.length : 0
    });

  } catch (error) {
    console.error('❌ Erreur MySQL:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur MySQL inconnue'
    }, { status: 500 });
  } finally {
    // Fermer la connexion
    if (connection) {
      try {
        await connection.end();
        console.log('🔌 Connexion MySQL fermée');
      } catch (closeError) {
        console.error('⚠️ Erreur fermeture connexion MySQL:', closeError);
      }
    }
  }
}
