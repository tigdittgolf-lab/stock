import { DatabaseConfig, DatabaseType } from './types';

/**
 * Obtient les paramètres par défaut pour un type de base de données
 */
export function getDatabaseDefaults(type: DatabaseType): Partial<DatabaseConfig> {
  switch (type) {
    case 'supabase':
      return {
        type: 'supabase',
        name: 'Supabase',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        host: undefined,
        port: undefined,
        database: undefined,
        username: undefined,
        password: undefined
      };
    
    case 'mysql':
      return {
        type: 'mysql',
        name: 'MySQL Local',
        supabaseUrl: undefined,
        supabaseKey: undefined,
        host: 'localhost',
        port: 3307,
        database: undefined, // Pas de base par défaut - on se connecte directement aux bases tenant
        username: 'root',
        password: ''
      };
    
    case 'postgresql':
      return {
        type: 'postgresql',
        name: 'PostgreSQL Local',
        supabaseUrl: undefined,
        supabaseKey: undefined,
        host: 'localhost',
        port: 5432,
        database: 'postgres', // CORRECTION: Utiliser 'postgres' comme base principale avec schémas
        username: 'postgres',
        password: 'postgres'
      };
    
    default:
      throw new Error(`Type de base de données non supporté: ${type}`);
  }
}

/**
 * Crée une configuration complète avec les valeurs par défaut
 */
export function createDatabaseConfig(type: DatabaseType, overrides: Partial<DatabaseConfig> = {}): DatabaseConfig {
  const defaults = getDatabaseDefaults(type);
  return {
    ...defaults,
    ...overrides,
    type // S'assurer que le type n'est pas écrasé
  } as DatabaseConfig;
}

/**
 * Met à jour une configuration existante avec les nouveaux paramètres par défaut
 */
export function updateDatabaseConfigType(currentConfig: DatabaseConfig, newType: DatabaseType): DatabaseConfig {
  const defaults = getDatabaseDefaults(newType);
  
  // Conserver certaines valeurs personnalisées si elles sont pertinentes
  const preservedValues: Partial<DatabaseConfig> = {};
  
  // Pour les bases locales, conserver host et database si définis
  if (newType !== 'supabase') {
    if (currentConfig.host && currentConfig.host !== 'localhost') {
      preservedValues.host = currentConfig.host;
    }
    if (currentConfig.database && currentConfig.database !== 'stock_local') {
      preservedValues.database = currentConfig.database;
    }
  }
  
  // Pour Supabase, conserver les URLs et clés si définies
  if (newType === 'supabase') {
    if (currentConfig.supabaseUrl) {
      preservedValues.supabaseUrl = currentConfig.supabaseUrl;
    }
    if (currentConfig.supabaseKey) {
      preservedValues.supabaseKey = currentConfig.supabaseKey;
    }
  }
  
  // CORRECTION: Créer une configuration propre en ne gardant que les champs pertinents
  const cleanConfig = {
    ...defaults,
    ...preservedValues,
    type: newType
  } as DatabaseConfig;

  // Nettoyer explicitement les champs non pertinents
  if (newType === 'supabase') {
    cleanConfig.host = undefined;
    cleanConfig.port = undefined;
    cleanConfig.database = undefined;
    cleanConfig.username = undefined;
    cleanConfig.password = undefined;
  } else {
    cleanConfig.supabaseUrl = undefined;
    cleanConfig.supabaseKey = undefined;
  }

  return cleanConfig;
}