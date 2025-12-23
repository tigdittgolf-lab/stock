// Test script to verify API URL generation
const getApiUrl = (endpoint) => {
  // CORRECTION: Toujours pointer vers le backend (port 3005)
  // Le frontend ne doit jamais appeler ses propres routes API pour les données
  return `http://localhost:3005/api/${endpoint}`;
};

console.log('Testing API URL generation:');
console.log('getApiUrl("sales/suppliers"):', getApiUrl('sales/suppliers'));
console.log('getApiUrl("sales/articles"):', getApiUrl('sales/articles'));
console.log('getApiUrl("sales/clients"):', getApiUrl('sales/clients'));