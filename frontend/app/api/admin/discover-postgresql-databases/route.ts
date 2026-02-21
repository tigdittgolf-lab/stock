import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function POST(request: NextRequest) {
  try {
    const { host, port, username, password, database } = await request.json();

    console.log('🔍 Découverte des schémas PostgreSQL...');

    const pool = new Pool({
      host,
      port,
      user: username,
      password,
      database
    });

    // Découvrir les schémas
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE '%_bu%'
        AND schema_name NOT IN ('information_schema', 'pg_catalog', 'public')
      ORDER BY schema_name
    `);

    const tenantDatabases = [];
    const otherDatabases = [];

    for (const row of schemasResult.rows) {
      const schemaName = row.schema_name;

      try {
        // Compter les tables
        const tablesResult = await pool.query(`
          SELECT COUNT(*) as count
          FROM information_schema.tables
          WHERE table_schema = $1 AND table_type = 'BASE TABLE'
        `, [schemaName]);

        const tableCount = parseInt(tablesResult.rows[0].count);

        // Estimer les enregistrements (limité à 3 tables pour la vitesse)
        const sampleTablesResult = await pool.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = $1 AND table_type = 'BASE TABLE'
          LIMIT 3
        `, [schemaName]);

        let estimatedRows = 0;
        for (const tableRow of sampleTablesResult.rows) {
          try {
            const countResult = await pool.query(
              `SELECT COUNT(*) as count FROM "${schemaName}"."${tableRow.table_name}"`
            );
            estimatedRows += parseInt(countResult.rows[0].count);
          } catch (e) {
            // Ignorer les erreurs
          }
        }

        const dbInfo = {
          name: schemaName,
          type: schemaName.match(/^\d{4}_bu\d{2}$/) ? 'tenant' as const : 'other' as const,
          tableCount,
          estimatedRows
        };

        if (dbInfo.type === 'tenant') {
          tenantDatabases.push(dbInfo);
        } else {
          otherDatabases.push(dbInfo);
        }
      } catch (error) {
        console.warn(`⚠️ Erreur analyse ${schemaName}:`, error);
      }
    }

    await pool.end();

    console.log(`✅ ${tenantDatabases.length + otherDatabases.length} schémas découverts`);

    return NextResponse.json({
      success: true,
      databases: {
        tenant: tenantDatabases,
        other: otherDatabases,
        total: tenantDatabases.length + otherDatabases.length
      }
    });

  } catch (error) {
    console.error('❌ Erreur découverte PostgreSQL:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
