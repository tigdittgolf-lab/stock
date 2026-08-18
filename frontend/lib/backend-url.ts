/**
 * Get the backend URL based on environment
 *
 * Mode offline (local) :
 *   - standalone/server : backend sur localhost (config.env)
 *   - client            : backend sur l'IP du serveur (= window.location.origin)
 *
 * Mode cloud :
 *   - en production : utilise ngrok tunnel vers le backend local
 *   - en développement : backend local
 */
export function getBackendUrl(path: string = ''): string {
  // Mode offline : on lit l'URL du backend depuis l'origin (client LAN)
  // ou depuis localhost (standalone/server).
  const offline = process.env.NEXT_PUBLIC_OFFLINE_MODE;
  if (offline === 'standalone' || offline === 'server') {
    const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || '3005';
    return `http://localhost:${backendPort}${path}`;
  }
  if (offline === 'client' && typeof window !== 'undefined') {
    // En mode client, window.origin pointe déjà vers le serveur.
    // Le frontend et le backend partagent la même origine via le proxy Next.js.
    return `${window.location.origin}/api${path}`;
  }

  // Mode cloud (comportement historique)
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://karmen-unordainable-irvin.ngrok-free.dev'
    : 'http://localhost:3005';
  
  return `${baseUrl}${path}`;
}
