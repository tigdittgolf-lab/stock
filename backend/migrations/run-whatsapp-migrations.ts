#!/usr/bin/env bun
/**
 * WhatsApp Document Sharing Migration Runner
 * Executes the WhatsApp tables migration for both PostgreSQL and MySQL
 * Requirements: 7.1, 5.3
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Database connection types
type DatabaseType = 'postgresql' | 'mysql';

interface DatabaseConfig {
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

/**
 * Run PostgreSQL migration using Supabase client
 */
async function runPostgreSQLMigration(config: DatabaseConfig) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Read PostgreSQL migration file
    const migrationSQL = readFileSync(
      join(__dirname, '001_create_whatsapp_tables.sql'),
      'utf-8'
    );
    
    console.log('🚀 Running PostgreSQL WhatsApp migration...');
    
    // Execute migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ PostgreSQL migration failed:', error);
      throw error;
    }
    
    console.log('✅ PostgreSQL WhatsApp migration completed successfully');
    
  } catch (error) {
    console.error('❌ PostgreSQL migration error:', error);
    throw error;
  }
}

/**
 * Run MySQL migration
 */
async function runMySQLMigration(config: DatabaseConfig) {
  try {
    const mysql = await import('mysql2/promise');
    
    // Create connection
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database
    });
    
    // Read MySQL migration file
    const migrationSQL = readFileSync(
      join(__dirname, '001_create_whatsapp_tables_mysql.sql'),
      'utf-8'
    );
    
    console.log('🚀 Running MySQL WhatsApp migration...');
    
    // Split SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
    
    await connection.end();
    
    console.log('✅ MySQL WhatsApp migration completed successfully');
    
  } catch (error) {
    console.error('❌ MySQL migration error:', error);
    throw error;
  }
}

/**
 * Main migration runner
 */
async function runMigrations() {
  console.log('🔧 Starting WhatsApp Document Sharing migrations...');
  
  try {
    // Check if we should run PostgreSQL migration (Supabase)
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await runPostgreSQLMigration({
        type: 'postgresql',
        host: '',
        port: 5432,
        database: '',
        username: '',
        password: ''
      });
    }
    
    // Check if we should run MySQL migration
    if (process.env.MYSQL_HOST && process.env.MYSQL_USER) {
      await runMySQLMigration({
        type: 'mysql',
        host: process.env.MYSQL_HOST,
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        database: process.env.MYSQL_DATABASE || 'stock_management',
        username: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD || ''
      });
    }
    
    console.log('🎉 All WhatsApp migrations completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this script is executed directly
if (import.meta.main) {
  runMigrations();
}

export { runMigrations, runPostgreSQLMigration, runMySQLMigration };