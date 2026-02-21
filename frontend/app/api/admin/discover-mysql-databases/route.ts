import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { host, port, username, password } = body;

    console.log('🔍 Découverte des bases MySQL:', { host, port, username });

    // Connexion MySQL
    const connection = await mysql.createConnection({
      host: host || 'localhost',
      port: port || 3306,
      user: username || 'root',
      password: password || ''
    });

    // Lister toutes les bases
    const [databases] = await connection.query('SHOW DATABASES');
    
    // Filtrer les bases système
    const systemDatabases = ['information_schema', 'mysql', 'performance_schema', 'sys'];
    const allDatabases = (databases as any[])
      .map(db => db.Database)
      .filter(name => !systemDatabases.includes(name));

    // Identifier les bases tenant (pattern: YYYY_buXX)
    const tenantPattern = /^\d{4}_bu\d{2}$/;
    const tenantDatabases = allDatabases.filter(name => tenantPattern.test(name));
    const otherDatabases = allDatabases.filter(name => !tenantPattern.test(name));

    // Pour chaque base tenant, compter les tables et enregistrements
    const databasesWithInfo = [];
    
    for (const dbName of tenantDatabases) {
      try {
        const [tables] = await connection.query(`
          SELECT 
            COUNT(*) as table_count,
            SUM(table_rows) as total_rows
          FROM information_schema.tables
          WHERE table_schema = ?
            AND table_type = 'BASE TABLE'
        `, [dbName]);

        const info = (tables as any[])[0];
        databasesWithInfo.push({
          name: dbName,
          type: 'tenant',
          tableCount: parseInt(info.table_count) || 0,
          estimatedRows: parseInt(info.total_rows) || 0
        });
      } catch (error) {
        console.warn(`Erreur analyse ${dbName}:`, error);
        databasesWithInfo.push({
          name: dbName,
          type: 'tenant',
          tableCount: 0,
          estimatedRows: 0,
          error: 'Inaccessible'
        });
      }
    }

    await connection.end();

    return NextResponse.json({
      success: true,
      databases: {
        tenant: databasesWithInfo,
        other: otherDatabases.map(name => ({ name, type: 'other' })),
        total: allDatabases.length
      }
    });

  } catch (error) {
    console.error('❌ Erreur découverte MySQL:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
