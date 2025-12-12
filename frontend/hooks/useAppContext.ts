import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface AppContext {
  username: string;
  businessUnit: string;
  year: number;
  schema: string;
  authenticated: boolean;
  loginTime: string;
}

export interface ApiHeaders {
  'Content-Type': string;
  'X-Tenant-Schema': string;
  'X-Business-Unit': string;
  'X-Year': string;
}

export function useAppContext() {
  const [context, setContext] = useState<AppContext | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    try {
      const appContextStr = sessionStorage.getItem('appContext');
      
      if (!appContextStr) {
        setLoading(false);
        return null;
      }

      const appContext: AppContext = JSON.parse(appContextStr);
      
      if (!appContext.authenticated) {
        setLoading(false);
        return null;
      }

      // Vérifier si la session n'est pas expirée (24h)
      const loginTime = new Date(appContext.loginTime);
      const now = new Date();
      const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        logout();
        return null;
      }

      setContext(appContext);
      setLoading(false);
      return appContext;
    } catch (error) {
      console.error('Error checking authentication:', error);
      setLoading(false);
      return null;
    }
  };

  const logout = () => {
    sessionStorage.clear();
    localStorage.removeItem('lastContext');
    setContext(null);
    router.push('/auth/login');
  };

  const changeContext = () => {
    // Garder l'utilisateur connecté mais permettre de changer BU/Année
    const user = sessionStorage.getItem('user');
    sessionStorage.clear();
    if (user) {
      sessionStorage.setItem('user', user);
    }
    setContext(null);
    router.push('/auth/login');
  };

  const getApiHeaders = (): ApiHeaders | null => {
    if (!context) return null;

    return {
      'Content-Type': 'application/json',
      'X-Tenant-Schema': context.schema,
      'X-Business-Unit': context.businessUnit,
      'X-Year': context.year.toString()
    };
  };

  const makeApiCall = async (url: string, options: RequestInit = {}) => {
    const headers = getApiHeaders();
    if (!headers) {
      throw new Error('No authentication context');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (response.status === 401) {
      logout();
      throw new Error('Authentication expired');
    }

    return response;
  };

  return {
    context,
    loading,
    logout,
    changeContext,
    getApiHeaders,
    makeApiCall,
    checkAuthentication
  };
}