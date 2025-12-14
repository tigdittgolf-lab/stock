// Client API robuste qui gère les réponses JSON corrompues
// Utilisation: import { apiClient } from '@/utils/apiClient';

class APIClient {
  private baseURL = 'http://localhost:3005';
  
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      let text = await response.text();
      
      // Nettoyer les réponses corrompues
      text = this.cleanResponse(text);
      
      // Parser le JSON nettoyé
      const data = JSON.parse(text);
      
      return {
        ok: response.ok,
        status: response.status,
        data
      };
      
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }
  
  private cleanResponse(text: string): string {
    // Supprimer les préfixes suspects
    if (text.startsWith('"OK"')) {
      console.warn('🧹 Cleaning "OK" prefix from response');
      text = text.substring(4);
    }
    
    // Supprimer les caractères de contrôle au début
    text = text.replace(/^[\x00-\x1F]+/, '');
    
    // Supprimer les caractères invisibles
    text = text.replace(/^\uFEFF/, ''); // BOM
    
    return text.trim();
  }
  
  // Méthodes de convenance
  async get(endpoint: string, headers: Record<string, string> = {}) {
    return this.request(endpoint, { method: 'GET', headers });
  }
  
  async post(endpoint: string, body: any, headers: Record<string, string> = {}) {
    return this.request(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
  }
  
  async put(endpoint: string, body: any, headers: Record<string, string> = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });
  }
  
  async delete(endpoint: string, headers: Record<string, string> = {}) {
    return this.request(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new APIClient();