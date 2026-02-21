/**
 * Get the backend URL based on environment
 * In production: uses Vercel-deployed backend
 * In development: uses local backend
 */
export function getBackendUrl(path: string = ''): string {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-j9xqorpps-habibbelkacemimosta-7724s-projects.vercel.app'
    : 'http://localhost:3005';
  
  return `${baseUrl}${path}`;
}
