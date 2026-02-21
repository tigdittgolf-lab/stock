/**
 * Get the backend URL based on environment
 * In production: uses ngrok tunnel to local backend
 * In development: uses local backend
 */
export function getBackendUrl(path: string = ''): string {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://karmen-unordainable-irvin.ngrok-free.dev'
    : 'http://localhost:3005';
  
  return `${baseUrl}${path}`;
}
