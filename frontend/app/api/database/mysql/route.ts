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

    console.log('🔄 Requête MySQL API:', {
      host: config.host,
      database: config.database,
      sqlLength: sql.length,
      sqlPreview: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
      paramsCount: params?.length || 0
    });

    // Créer la connexion MySQL avec gestion d'erreur détaillée
    try {
      connection = await mysql.createConnection({
        host: config.host || 'localhost',
        port: config.port || 3306,
        user: config.username || 'root',
        password: config.password || '',
        database: config.database,
        multipleStatements: true,
        connectTimeout: 10000 // 10 secondes
      });

      console.log('✅ Connexion MySQL API établie pour base:', config.database);
    } catch (connectionError) {
      console.error('❌ Erreur connexion MySQL API:', connectionError);
      throw new Error(`Connexion MySQL échouée: ${connectionError instanceof Error ? connectionError.message : 'Erreur inconnue'}`);
    }

    // Exécuter la requête avec gestion d'erreur détaillée
    let rows, fields;
    try {
      [rows, fields] = await connection.execute(sql, params || []);
      
      const resultCount = Array.isArray(rows) ? rows.length : 0;
      console.log('✅ Requête MySQL API exécutée:', {
        resultCount,
        hasResults: resultCount > 0,
        resultType: typeof rows
      });

      return NextResponse.json({
        success: true,
        data: rows,
        rowCount: resultCount,
        message: `Requête exécutée avec succès: ${resultCount} résultats`
      });

    } catch (queryError) {
      console.error('❌ Erreur exécution requête MySQL:', {
        error: queryError,
        sql: sql.substring(0, 200),
        database: config.database
      });
      
      // Analyser le type d'erreur pour un diagnostic plus précis
      let errorMessage = 'Erreur MySQL inconnue';
      if (queryError instanceof Error) {
        errorMessage = queryError.message;
        
        if (errorMessage.includes('Unknown database')) {
          errorMessage = `Base de données '${config.database}' n'existe pas`;
        } else if (errorMessage.includes('Table') && errorMessage.includes("doesn't exist")) {
          errorMessage = `Table n'existe pas dans la base '${config.database}'`;
        } else if (errorMessage.includes('syntax error')) {
          errorMessage = `Erreur de syntaxe SQL: ${errorMessage}`;
        }
      }
      
      throw new Error(errorMessage);
    }

  } catch (error) {
    console.error('❌ Erreur MySQL API globale:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur MySQL API inconnue',
      details: {
        type: typeof error,
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined
      }
    }, { status: 500 });
  } finally {
    // Fermer la connexion
    if (connection) {
      try {
        await connection.end();
        console.log('🔌 Connexion MySQL API fermée');
      } catch (closeError) {
        console.error('⚠️ Erreur fermeture connexion MySQL API:', closeError);
      }
    }
  }
}
