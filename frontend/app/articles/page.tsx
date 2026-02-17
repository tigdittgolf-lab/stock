'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ArticlesPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers le dashboard
    router.push('/dashboard');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <p>Redirection...</p>
    </div>
  );
}
