'use client';

import { useState, useEffect } from 'react';

export default function DatabaseSelector() {
  const [currentDb, setCurrentDb] = useState<string>('supabase');
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // Lire la config actuelle
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeDbConfig');
      if (saved) {
        const config = JSON.parse(saved);
        setCurrentDb(config.type || 'supabase');
      }
    }
  }, []);

  const changeDatabase = async (newType: string) => {
    setIsChanging(true);
    
    try {
      const configs = {
        supabase: {
          type: 'supabase',
          name: 'Supabase Cloud',
          supabaseUrl: 'https://szgodrjglbpzkrksnroi.supabase.co'
        },
        mysql: {
          type: 'mysql',
          name: 'MySQL Local',
          host: 'localhost',
          port: 3306,
          database: 'stock_management',
          username: 'root',
          password: ''
        },
        postgresql: {
          type: 'postgresql',
          name: 'PostgreSQL Local',
          host: 'localhost',
          port: 5432,
          database: 'stock_management',
          username: 'postgres',
          password: 'postgres'
        }
      };

      const config = configs[newType as keyof typeof configs];
      
      if (config) {
        localStorage.setItem('activeDbConfig', JSON.stringify({
          ...config,
          isActive: true,
          lastTested: new Date().toISOString()
        }));
        
        setCurrentDb(newType);
        
        // Recharger la page pour appliquer les changements
        window.location.reload();
      }
    } catch (error) {
      console.error('Erreur changement base:', error);
      alert('Erreur lors du changement de base de données');
    } finally {
      setIsChanging(false);
    }
  };

  const databases = [
    { value: 'supabase', label: '☁️ Supabase (Cloud)', color: '#3ecf8e' },
    { value: 'mysql', label: '🐬 MySQL (Local)', color: '#f29111' },
    { value: 'postgresql', label: '🐘 PostgreSQL (Local)', color: '#336791' }
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      padding: '8px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>
        Base de données:
      </span>
      
      {databases.map(db => (
        <button
          key={db.value}
          onClick={() => changeDatabase(db.value)}
          disabled={isChanging || currentDb === db.value}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: currentDb === db.value ? `2px solid ${db.color}` : '1px solid #e5e7eb',
            backgroundColor: currentDb === db.value ? `${db.color}15` : 'white',
            color: currentDb === db.value ? db.color : '#6b7280',
            fontSize: '13px',
            fontWeight: currentDb === db.value ? '600' : '400',
            cursor: currentDb === db.value ? 'default' : 'pointer',
            opacity: isChanging ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
        >
          {db.label}
        </button>
      ))}
      
      {isChanging && (
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
