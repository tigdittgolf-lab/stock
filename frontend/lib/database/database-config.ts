/**
 * Configuration de la base de données selon l'environnement
 */

export type DatabaseType = 'supabase' | 'mysql' | 'postgresql';

/**
 * Détermine la base de données à utiliser selon l'environnement
 */
export function getDatabaseForEnvironment(requestedType: DatabaseType): DatabaseType {
  // En production (Vercel), seul Supabase est disponible
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    if (requestedType === 'mysql' || requestedType === 'postgresql') {
      console.warn(`⚠️ Production: ${requestedType} non disponible, utilisation de Supabase`);
      return 'supabase';
    }
  }
  
  return requestedType;
}

/**
 * Vérifie si une base de données est disponible dans l'environnement actuel
 */
export function isDatabaseAvailable(dbType: DatabaseType): boolean {
  // En production, seul Supabase est disponible
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return dbType === 'supabase';
  }
  
  // En développement, toutes les bases sont disponibles
  return true;
}

/**
 * Retourne un message d'avertissement si la base n'est pas disponible
 */
export function getDatabaseWarning(dbType: DatabaseType): string | null {
  if (!isDatabaseAvailable(dbType)) {
    return `La base de données ${dbType} n'est pas disponible en production. Utilisation de Supabase.`;
  }
  return null;
}
