// Types pour la configuration de base de données
export type DatabaseType = 'supabase' | 'postgresql' | 'mysql';

export interface DatabaseConfig {
  type: DatabaseType;
  // Configuration Supabase
  supabaseUrl?: string;
  supabaseKey?: string;
  // Configuration base locale
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  // Métadonnées
  name?: string;
  isActive?: boolean;
  lastTested?: string;
}

export interface QueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  rowCount?: number;
}

export interface DatabaseAdapter {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  query(sql: string, params?: any[]): Promise<QueryResult>;
  testConnection(): Promise<boolean>;
  getSchemas(): Promise<string[]>;
  createSchema(schemaName: string): Promise<boolean>;
  executeRPC(functionName: string, params: Record<string, any>): Promise<QueryResult>;
}

export interface DatabaseManager {
  getCurrentAdapter(): DatabaseAdapter;
  switchDatabase(config: DatabaseConfig): Promise<boolean>;
  getActiveConfig(): DatabaseConfig | null;
  testConfig(config: DatabaseConfig): Promise<boolean>;
}