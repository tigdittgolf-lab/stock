// Utilitaire pour gérer les réponses JSON corrompues
// Utilisation: import { safeFetch } from '@/utils/safeFetch';

export async function safeFetch(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);
    let text = await response.text();
    
    // Nettoyer les caractères suspects au début
    if (text.startsWith('"OK"')) {
      console.warn('🧹 Cleaning "OK" prefix from response');
      text = text.substring(4);
    }
    
    // Supprimer les caractères de contrôle invisibles
    text = text.replace(/^[\x00-\x1F]+/, '');
    
    // Tenter le parsing JSON
    try {
      const json = JSON.parse(text);
      return {
        ok: response.ok,
        status: response.status,
        json: () => Promise.resolve(json),
        text: () => Promise.resolve(text)
      };
    } catch (parseError) {
      console.error('❌ JSON parse failed even after cleaning:', parseError);
      console.error('Raw text:', JSON.stringify(text.substring(0, 100)));
      throw new Error(`JSON Parse Error: ${parseError instanceof Error ? parseError.message : 'Erreur inconnue'}`);
    }
    
  } catch (error) {
    console.error('💥 safeFetch error:', error);
    throw error;
  }
}