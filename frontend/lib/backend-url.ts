/**
 * Get the backend URL based on environment
 * In production: uses Tailscale tunnel to local backend
 * In development: uses local backend
 */
export function getBackendUrl(path: string = ''): string {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://desktop-bhhs068.tail1d9c54.ts.net:3005'
    : 'http://localhost:3005';
  
  return `${baseUrl}${path}`;
}
