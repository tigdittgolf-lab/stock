// Configuration des URLs selon l'environnement
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_API_URL || 'https://votre-app.vercel.app/api'
  : 'http://localhost:3005/api';

export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://votre-projet.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'votre_cle_publique'
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