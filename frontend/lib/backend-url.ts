/**
 * Get the backend URL based on environment
 * In production: uses Cloudflare Tunnel to local backend
 * In development: uses local backend
 */
export function getBackendUrl(path: string = ''): string {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://airport-blackberry-ink-originally.trycloudflare.com'
    : 'http://localhost:3005';
  
  return `${baseUrl}${path}`;
}
