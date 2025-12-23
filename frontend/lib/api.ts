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
  // Détecter l'environnement
  const isProduction = process.env.NODE_ENV === 'production' || 
                      (typeof window !== 'undefined' && window.location.hostname !== 'localhost');
  
  if (isProduction) {
    // En production, utiliser les routes API Next.js intégrées
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/${endpoint}`;
    }
    // Fallback SSR
    return `/api/${endpoint}`;
  } else {
    // En développement, utiliser le backend séparé
    return `http://localhost:3005/api/${endpoint}`;
  }
};