/**
 * Get the backend URL based on environment
 * In production: uses BACKEND_URL environment variable (Cloudflare Tunnel)
 * In development: uses local backend
 */
export function getBackendUrl(path: string = ''): string {
  // En production, utiliser la variable d'environnement BACKEND_URL
  // qui peut être mise à jour dans Vercel sans redéployer
  const baseUrl = process.env.NODE_ENV === 'production'
    ? (process.env.BACKEND_URL || 'http://localhost:3005')
    : 'http://localhost:3005';
  
  return `${baseUrl}${path}`;
}
