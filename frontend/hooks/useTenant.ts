'use client';

import { useState, useEffect } from 'react';

export function useTenant() {
  const [tenant, setTenant] = useState<string>('2025_bu01'); // Valeur par défaut

  useEffect(() => {
    // Récupérer le tenant depuis localStorage ou sessionStorage
    const storedTenant = localStorage.getItem('selectedTenant') || 
                        sessionStorage.getItem('selectedTenant') ||
                        '2025_bu01'; // Fallback
    
    setTenant(storedTenant);
  }, []);

  return tenant;
}