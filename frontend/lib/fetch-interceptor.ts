'use client';

import { useEffect } from 'react';

// Composant client pour installer l'intercepteur fetch
export default function FetchInterceptor() {
  useEffect(() => {
    // Installer l'intercepteur une seule fois
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
      let [resource, config] = args;
      
      // Ajouter les headers par défaut si la requête va vers notre API
      if (typeof resource === 'string' && (
        resource.includes('localhost:3005') || 
        resource.includes('/api/')
      )) {
        // Récupérer la configuration de la base de données active
        let dbType = 'mysql'; // CHANGÉ: Par défaut MySQL au lieu de Supabase
        try {
          const activeDbConfig = localStorage.getItem('activeDbConfig');
          console.log('🔍 FetchInterceptor - activeDbConfig from localStorage:', activeDbConfig);
          
          if (activeDbConfig) {
            const parsedConfig = JSON.parse(activeDbConfig);
            dbType = parsedConfig.type || 'mysql';
            console.log('✅ FetchInterceptor - Parsed DB type:', dbType);
          } else {
            console.warn('⚠️ FetchInterceptor - No activeDbConfig found, using default: mysql');
          }
        } catch (e) {
          console.error('❌ FetchInterceptor - Failed to parse activeDbConfig:', e);
        }
        
        // Récupérer le tenant
        const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
        
        // Ajouter les headers
        config = config || {};
        config.headers = {
          'X-Database-Type': dbType,
          'X-Tenant': tenant,
          ...config.headers,
        };
        
        console.log(`🔧 Fetch interceptor: ${resource} → DB: ${dbType}, Tenant: ${tenant}`);
      }
      
      return originalFetch(resource, config);
    };
    
    console.log('✅ Fetch interceptor installed');
  }, []);
  
  return null; // Ce composant ne rend rien
}
