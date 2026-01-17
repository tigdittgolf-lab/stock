#!/usr/bin/env bun

/**
 * Simple MySQL WhatsApp Migration Runner
 * Runs the WhatsApp table migrations for MySQL
 */

import { readFileSync } from 'fs';
import { join } from 'path';

async function runMySQLMigrations() {
  try {
    console.log('🚀 Running MySQL WhatsApp migrations...');
    
    const mysql = await import('mysql2/promise');
    
    // Get database config from environment or use defaults
    const config = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || '2025_bu01'
    };
    
    console.log(`📡 Connecting to MySQL: ${config.host}:${config.port}/${config.database}`);
    
    // Create connection
    const connection = await mysql.createConnection(config);
    
    // Migration 1: Create WhatsApp tables
    console.log('📋 Running migration 1: Create WhatsApp tables...');
    const migration1SQL = readFileSync(
      join(__dirname, 'migrations/001_create_whatsapp_tables_mysql.sql'),
      'utf-8'
    );
    
    const statements1 = migration1SQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements1) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
        } catch (error: any) {
          if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
            console.error(`❌ Error executing statement: ${statement.substring(0, 100)}...`);
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Migration 1 completed');
    
    // Migration 2: Add logging table
    console.log('📋 Running migration 2: Add WhatsApp logs table...');
    const migration2SQL = readFileSync(
      join(__dirname, 'migrations/002_add_whatsapp_logs_table_mysql.sql'),
      'utf-8'
    );
    
    const statements2 = migration2SQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements2) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
        } catch (error: any) {
          if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
            console.error(`❌ Error executing statement: ${statement.substring(0, 100)}...`);
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Migration 2 completed');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'whatsapp_%'
    `, [config.database]);
    
    console.log('📊 WhatsApp tables created:');
    (tables as any[]).forEach(table => {
      console.log(`   ✅ ${table.TABLE_NAME}`);
    });
    
    await connection.end();
    
    console.log('🎉 All MySQL WhatsApp migrations completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this script is executed directly
if (import.meta.main) {
  runMySQLMigrations();
}

export { runMySQLMigrations };