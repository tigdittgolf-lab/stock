import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, sql, table } = body;

    if (!description || !sql) {
      return NextResponse.json({
        success: false,
        error: 'Description et SQL sont requis'
      }, { status: 400 });
    }

    // Trouver le prochain numéro de version
    const migrationsDir = join(process.cwd(), '..', 'backend', 'migrations', 'versions');
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    
    let nextVersion = 1;
    if (sqlFiles.length > 0) {
      const lastFile = sqlFiles[sqlFiles.length - 1];
      const match = lastFile.match(/^(\d+)_/);
      if (match) {
        nextVersion = parseInt(match[1]) + 1;
      }
    }

    const versionStr = String(nextVersion).padStart(3, '0');
    const descSlug = description
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    
    const filename = `${versionStr}_${descSlug}.sql`;
    const today = new Date().toISOString().split('T')[0];

    // Créer le contenu du fichier
    const content = `-- Migration: ${versionStr}_${descSlug}
-- Description: ${description}
-- Table: ${table}
-- Date: ${today}

${sql}
`;

    // Écrire le fichier
    const filepath = join(migrationsDir, filename);
    await writeFile(filepath, content, 'utf-8');

    console.log('✅ Migration créée:', filename);

    return NextResponse.json({
      success: true,
      data: {
        version: versionStr,
        filename,
        description
      },
      message: `Migration ${versionStr} créée avec succès`
    });

  } catch (error) {
    console.error('❌ Erreur création migration:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la création de la migration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
