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
  
  // Récupérer la configuration de la base de données active
  let dbType = 'supabase';
  try {
    const activeDbConfig = localStorage.getItem('activeDbConfig');
    if (activeDbConfig) {
      const config = JSON.parse(activeDbConfig);
      dbType = config.type || 'supabase';
    }
  } catch (e) {
    console.warn('⚠️ Failed to parse activeDbConfig:', e);
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
export const getApiUrl = (endpoint: string): string => {
  // En développement, utiliser le backend sur le port 3005
  if (typeof window !== 'undefined') {
    // Vérifier si on est en développement (localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const url = `http://localhost:3005/api/${endpoint}`;
      console.log('🌐 API URL (Dev):', url);
      return url;
    }
    
    // En production, utiliser l'URL actuelle
    const url = `${window.location.origin}/api/${endpoint}`;
    console.log('🌐 API URL (Prod):', url);
    return url;
  }
  
  // Fallback SSR
  const url = process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}`
    : `http://localhost:3005/api/${endpoint}`;
  console.log('🔄 Fallback SSR URL:', url);
  return url;
};

// Fonction helper pour obtenir les headers par défaut avec X-Database-Type
export const getDefaultHeaders = (): Record<string, string> => {
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