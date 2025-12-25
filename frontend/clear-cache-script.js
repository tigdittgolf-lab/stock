// Script pour forcer le vidage du cache frontend
if (typeof window !== 'undefined') {
  // Vider le localStorage
  localStorage.clear();
  
  // Vider le sessionStorage
  sessionStorage.clear();
  
  // Forcer le rechargement sans cache
  window.location.reload(true);
}

console.log('Cache vidé - rechargement forcé');