'use client';

import { useState, useEffect } from 'react';

interface Tenant {
  id: string;
  schema: string;
  name?: string;
}

export function useTenant(): Tenant | null {
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    // Récupérer le tenant depuis localStorage
    const tenantInfo = localStorage.getItem('tenant_info');
    
    if (tenantInfo) {
      try {
        const parsed = JSON.parse(tenantInfo);
        setTenant({
          id: parsed.schema || '2025_bu01',
          schema: parsed.schema || '2025_bu01',
          name: parsed.name || 'Default Tenant'
        });
      } catch (error) {
        console.error('Error parsing tenant info:', error);
        // Fallback to default tenant
        setTenant({
          id: '2025_bu01',
          schema: '2025_bu01',
          name: 'Default Tenant'
        });
      }
    } else {
      // Fallback to default tenant
      setTenant({
        id: '2025_bu01',
        schema: '2025_bu01',
        name: 'Default Tenant'
      });
    }
  }, []);

  return tenant;
}