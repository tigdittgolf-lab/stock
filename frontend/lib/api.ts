// Configuration API centralisée
import { getBackendBaseUrl, isOffline, getTenant } from './offline-mode';

export const getApiBaseUrl = (): string => {
  // Mode offline (local) : URL déterminée par le lanceur
  if (isOffline()) {
    const offlineUrl = getBackendBaseUrl();
    if (offlineUrl) return offlineUrl;
  }

  // En production sur Vercel, utiliser l'URL actuelle
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  
  // Fallback pour le développement ou SSR
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api';
};

// Fonction utilitaire pour construire les URLs API
export const apiUrl = (endpoint: string): string => {
  // Supprimer le slash initial si présent
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Supprimer /api du début si présent (pour éviter la duplication)
  const finalEndpoint = cleanEndpoint.startsWith('api/') ? cleanEndpoint.slice(4) : cleanEndpoint;
  
  return `${getApiBaseUrl()}/${finalEndpoint}`;
};

// Fonction pour les requêtes avec tenant
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // En mode offline, on lit la config (tenant + type de base) depuis le module dédié.
  // En mode cloud, on conserve le comportement historique (localStorage).
  let tenant: string;
  let dbType: string;

  if (isOffline()) {
    tenant = getTenant();
    dbType = 'mysql';
  } else {
    tenant = (typeof window !== 'undefined'
      ? localStorage.getItem('selectedTenant') || '2025_bu01'
      : '2025_bu01');
    dbType = 'supabase';
    if (typeof window !== 'undefined') {
      try {
        const activeDbConfig = localStorage.getItem('activeDbConfig');
        if (activeDbConfig) {
          const config = JSON.parse(activeDbConfig);
          dbType = config.type || 'supabase';
        }
      } catch (e) {
        console.warn('⚠️ Failed to parse activeDbConfig:', e);
      }
    }
  }
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-Tenant': tenant,
    'X-Database-Type': dbType,
  };

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  return fetch(apiUrl(endpoint), mergedOptions);
};

// Fonction utilitaire pour les URLs API - PRODUCTION READY
// Retourne toujours une URL relative /api/... pour éviter les problèmes avec le fetch interceptor
export const getApiUrl = (endpoint: string): string => {
  const clean = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const final = clean.startsWith('api/') ? clean.slice(4) : clean;
  if (typeof window !== 'undefined') {
    console.log('🌐 API URL:', `${window.location.origin}/api/${final}`);
  }
  return `/api/${final}`;
};

// Fonction helper pour obtenir les headers par défaut avec X-Database-Type
export const getDefaultHeaders = (): Record<string, string> => {
  // En mode offline, on centralise via le module dédié
  if (isOffline()) {
    return {
      'Content-Type': 'application/json',
      'X-Tenant': getTenant(),
      'X-Database-Type': 'mysql',
    };
  }

  // Mode cloud : comportement historique
  const tenant = typeof window !== 'undefined' 
    ? localStorage.getItem('selectedTenant') || '2025_bu01'
    : '2025_bu01';
  
  let dbType = 'supabase';
  if (typeof window !== 'undefined') {
    try {
      const activeDbConfig = localStorage.getItem('activeDbConfig');
      if (activeDbConfig) {
        const config = JSON.parse(activeDbConfig);
        dbType = config.type || 'supabase';
      }
    } catch (e) {
      console.warn('⚠️ Failed to parse activeDbConfig:', e);
    }
  }
  
  return {
    'Content-Type': 'application/json',
    'X-Tenant': tenant,
    'X-Database-Type': dbType,
  };
};