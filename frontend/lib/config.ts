// Configuration des URLs selon l'environnement
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://desktop-bhhs068.tail1d9c54.ts.net/api'
  : 'http://localhost:3005/api';

// Configuration pour mode offline (sans Internet)
export const getApiBaseUrl = () => {
  // Si on est en développement local ou pas d'Internet
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3005/api';
  }
  
  // Sinon utiliser la configuration normale
  return API_BASE_URL;
};

export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg'
};

// Helper pour construire les URLs d'API
export const getApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Configuration JWT
export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  expiresIn: '24h'
};

console.log('🌍 Environment:', process.env.NODE_ENV);
console.log('🔗 API Base URL:', API_BASE_URL);