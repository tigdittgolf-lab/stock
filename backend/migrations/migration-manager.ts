import mysql from 'mysql2/promise';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

interface MigrationFile {
  version: string;
  filename: string;
  description: string;
  sql: string;
}

interface MigrationResult {
  database: string;
  version: string;
  success: boolean;
  error?: string;
  duration: number;
}

export class MigrationManager {
  private connection: mysql.Connection | null = null;

  constructor(
    private host: string,
    private user: string,
    private password: string,
    private port: number = 3306
  ) {}

  /**
   * Connexion à MySQL (sans base spécifique)
   */
  async connect(): Promise<void> {
    this.connection = await mysql.createConnection({
      host: this.host,
      user: this.user,
      password: this.password,
      port: this.port,
      multipleStatements: true
    });
    console.log('✅ Connecté à MySQL');
  }

  /**
   * Déconnexion
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      console.log('✅ Déconnecté de MySQL');
    }
  }

  /**
   * Récupérer toutes les bases de données (format: YYYY_buXX)
   */
  async getAllDatabases(): Promise<string[]> {
    if (!this.connection) throw new Error('Non connecté');

    const [rows] = await this.connection.query<any[]>(
      'SHOW DATABASES WHERE `Database` REGEXP "^[0-9]{4}_bu[0-9]{2}$"'
    );

    return rows.map((row: any) => row.Database);
  }

  /**
   * Créer la table de suivi des migrations dans une base
   */
  async ensureMigrationsTable(database: string): Promise<void> {
    if (!this.connection) throw new Error('Non connecté');

    await this.connection.query(`USE \`${database}\``);
    
    await this.connection.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        version VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        duration_ms INT,
        INDEX idx_version (version)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  /**
   * Vérifier si une migration a déjà été appliquée
   */
  async isMigrationApplied(database: string, version: string): Promise<boolean> {
    if (!this.connection) throw new Error('Non connecté');

    await this.connection.query(`USE \`${database}\``);
    
    const [rows] = await this.connection.query<any[]>(
      'SELECT COUNT(*) as count FROM _migrations WHERE version = ?',
      [version]
    );

    return rows[0].count > 0;
  }

  /**
   * Enregistrer une migration appliquée
   */
  async recordMigration(
    database: string,
    version: string,
    description: string,
    duration: number
  ): Promise<void> {
    if (!this.connection) throw new Error('Non connecté');

    await this.connection.query(`USE \`${database}\``);
    
    await this.connection.query(
      'INSERT INTO _migrations (version, description, duration_ms) VALUES (?, ?, ?)',
      [version, description, duration]
    );
  }

  /**
   * Lire tous les fichiers de migration
   */
  async loadMigrations(): Promise<MigrationFile[]> {
    const migrationsDir = join(__dirname, 'versions');
    const files = await readdir(migrationsDir);
    
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort(); // Tri alphabétique (001, 002, 003...)

    const migrations: MigrationFile[] = [];

    for (const filename of sqlFiles) {
      const content = await readFile(join(migrationsDir, filename), 'utf-8');
      
      // Extraire version et description du nom de fichier
      const match = filename.match(/^(\d+)_(.+)\.sql$/);
      if (!match) continue;

      const [, version, desc] = match;
      const description = desc.replace(/_/g, ' ');

      migrations.push({
        version,
        filename,
        description,
        sql: content
      });
    }

    return migrations;
  }

  /**
   * Appliquer une migration à une base de données
   */
  async applyMigration(
    database: string,
    migration: MigrationFile
  ): Promise<MigrationResult> {
    if (!this.connection) throw new Error('Non connecté');

    const startTime = Date.now();

    try {
      // Vérifier si déjà appliquée
      const applied = await this.isMigrationApplied(database, migration.version);
      if (applied) {
        return {
          database,
          version: migration.version,
          success: true,
          error: 'Déjà appliquée',
          duration: 0
        };
      }

      // Utiliser la base de données
      await this.connection.query(`USE \`${database}\``);

      // Commencer une transaction
      await this.connection.beginTransaction();

      try {
        // Exécuter le SQL de migration
        await this.connection.query(migration.sql);

        // Enregistrer la migration
        const duration = Date.now() - startTime;
        await this.recordMigration(
          database,
          migration.version,
          migration.description,
          duration
        );

        // Commit
        await this.connection.commit();

        return {
          database,
          version: migration.version,
          success: true,
          duration
        };
      } catch (error) {
        // Rollback en cas d'erreur
        await this.connection.rollback();
        throw error;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        database,
        version: migration.version,
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        duration
      };
    }
  }

  /**
   * Appliquer toutes les migrations à toutes les bases
   */
  async applyAllMigrations(
    targetDatabase?: string
  ): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    // Récupérer les bases de données
    const databases = targetDatabase
      ? [targetDatabase]
      : await this.getAllDatabases();

    console.log(`\n📊 Bases de données trouvées: ${databases.length}`);
    databases.forEach(db => console.log(`   - ${db}`));

    // Charger les migrations
    const migrations = await this.loadMigrations();
    console.log(`\n📦 Migrations trouvées: ${migrations.length}`);
    migrations.forEach(m => console.log(`   - ${m.version}: ${m.description}`));

    // Appliquer à chaque base
    for (const database of databases) {
      console.log(`\n🔄 Traitement de ${database}...`);

      // Créer la table de suivi
      await this.ensureMigrationsTable(database);

      // Appliquer chaque migration
      for (const migration of migrations) {
        console.log(`   ⏳ Migration ${migration.version}...`);
        
        const result = await this.applyMigration(database, migration);
        results.push(result);

        if (result.success) {
          if (result.error === 'Déjà appliquée') {
            console.log(`   ⏭️  Déjà appliquée`);
          } else {
            console.log(`   ✅ Appliquée (${result.duration}ms)`);
          }
        } else {
          console.log(`   ❌ Erreur: ${result.error}`);
        }
      }
    }

    return results;
  }

  /**
   * Obtenir le statut des migrations pour toutes les bases
   */
  async getMigrationStatus(): Promise<any> {
    const databases = await this.getAllDatabases();
    const migrations = await this.loadMigrations();
    const status: any = {};

    for (const database of databases) {
      await this.ensureMigrationsTable(database);
      
      const dbStatus: any = {
        total: migrations.length,
        applied: 0,
        pending: 0,
        migrations: []
      };

      for (const migration of migrations) {
        const applied = await this.isMigrationApplied(database, migration.version);
        
        dbStatus.migrations.push({
          version: migration.version,
          description: migration.description,
          applied
        });

        if (applied) {
          dbStatus.applied++;
        } else {
          dbStatus.pending++;
        }
      }

      status[database] = dbStatus;
    }

    return status;
  }
}
