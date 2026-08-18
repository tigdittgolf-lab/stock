/**
 * Module de détection du mode offline (local) pour StockApp.
 *
 * Trois modes possibles, déterminés par la variable d'environnement
 * NEXT_PUBLIC_OFFLINE_MODE injectée par le lanceur (config.env) :
 *   - 'standalone' : tout sur ce PC (localhost)
 *   - 'server'     : ce PC héberge le serveur pour le LAN
 *   - 'client'     : ce PC se connecte à un serveur distant sur le LAN
 *
 * Si la variable n'est PAS définie, l'application fonctionne comme avant
 * (mode cloud Supabase). Aucune régression.
 */

export type OfflineMode = 'standalone' | 'server' | 'client' | null;

/**
 * Renvoie le mode offline actuel, ou null si l'app tourne en mode cloud.
 */
export function getOfflineMode(): OfflineMode {
  const raw = process.env.NEXT_PUBLIC_OFFLINE_MODE;
  if (raw === 'standalone' || raw === 'server' || raw === 'client') {
    return raw;
  }
  return null;
}

/**
 * Indique si l'application tourne en mode offline (local).
 */
export function isOffline(): boolean {
  return getOfflineMode() !== null;
}

/**
 * URL de base du backend, tenant compte du mode.
 *
 * - En mode cloud (non offline) : on laisse l'app décider (window.origin ou NEXT_PUBLIC_API_URL).
 * - En mode standalone/server : http://localhost:<backendPort>
 * - En mode client : http://<IP-serveur>:<backendPort>
 */
export function getBackendBaseUrl(): string | null {
  const mode = getOfflineMode();
  if (!mode) return null; // mode cloud : l'app utilise son URL normale

  if (mode === 'client') {
    // En mode client, le navigateur est sur http://<IP>:<port>,
    // donc window.location.origin pointe déjà vers le serveur.
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api`;
    }
    return null;
  }

  // standalone ou server : backend sur localhost
  const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || '3005';
  return `http://localhost:${backendPort}/api`;
}

/**
 * Type de base de données à utiliser.
 * En mode offline, toujours MySQL.
 */
export function getDatabaseType(): string {
  if (isOffline()) {
    return 'mysql';
  }
  // Mode cloud : laisser l'app décider (Supabase par défaut)
  if (typeof window !== 'undefined') {
    try {
      const activeDbConfig = localStorage.getItem('activeDbConfig');
      if (activeDbConfig) {
        const config = JSON.parse(activeDbConfig);
        return config.type || 'supabase';
      }
    } catch {
      // ignore
    }
  }
  return 'supabase';
}

/**
 * Tenant par défaut selon le mode.
 */
export function getTenant(): string {
  if (isOffline()) {
    return process.env.NEXT_PUBLIC_TENANT || '2025_bu01';
  }
  if (typeof window !== 'undefined') {
    return localStorage.getItem('selectedTenant') || '2025_bu01';
  }
  return '2025_bu01';
}
