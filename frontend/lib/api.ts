// Configuration API centralisée
export const getApiBaseUrl = (): string => {
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
  const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-Tenant': tenant,
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
export const getApiUrl = (endpoint: string): string => {
  // Détecter l'environnement - plus robuste
  const isLocalhost = typeof window !== 'undefined' && 
                     (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  // En mode développement Next.js, NODE_ENV est 'development'
  // En production Vercel, NODE_ENV est 'production'
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log('🔍 API URL Debug:', {
    endpoint,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
    port: typeof window !== 'undefined' ? window.location.port : 'SSR',
    isLocalhost,
    isDevelopment,
    isProduction,
    NODE_ENV: process.env.NODE_ENV
  });
  
  // Si on est sur localhost ET en mode développement, utiliser le backend local
  if (isLocalhost && isDevelopment) {
    const url = `http://localhost:3005/api/${endpoint}`;
    console.log('🏠 Local Development URL:', url);
    return url;
  }
  
  // Sinon, utiliser les routes API Next.js intégrées (production ou SSR)
  if (typeof window !== 'undefined') {
    const url = `${window.location.origin}/api/${endpoint}`;
    console.log('🌐 Production/SSR URL:', url);
    return url;
  }
  
  // Fallback SSR
  const url = `/api/${endpoint}`;
  console.log('🔄 Fallback SSR URL:', url);
  return url;
};