'use client';

import { useState, useEffect } from 'react';

export default function DatabaseSelectorCompact() {
  const [currentDb, setCurrentDb] = useState<string>('mysql');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeDbConfig');
      if (saved) {
        const config = JSON.parse(saved);
        setCurrentDb(config.type || 'mysql');
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
        setIsModalOpen(false);
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
    { 
      value: 'mysql', 
      label: 'MySQL Local', 
      icon: '🐬', 
      color: '#f29111',
      description: 'Base de données locale MySQL'
    },
    { 
      value: 'postgresql', 
      label: 'PostgreSQL Local', 
      icon: '🐘', 
      color: '#336791',
      description: 'Base de données locale PostgreSQL'
    },
    { 
      value: 'supabase', 
      label: 'Supabase Cloud', 
      icon: '☁️', 
      color: '#3ecf8e',
      description: 'Base de données cloud Supabase'
    }
  ];

  const currentDbInfo = databases.find(db => db.value === currentDb) || databases[0];

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={isChanging}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s',
          opacity: isChanging ? 0.5 : 1
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{currentDbInfo.icon}</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '500' }}>
              Base de données
            </span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: currentDbInfo.color }}>
              {currentDbInfo.label}
            </span>
          </div>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>⚙️</span>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setIsModalOpen(false)}
        >
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border-color)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                🗄️ Sélectionner la base de données
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  padding: '4px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Description */}
            <p style={{
              margin: '0 0 20px 0',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}>
              Choisissez la base de données que vous souhaitez utiliser. L'application sera rechargée après le changement.
            </p>

            {/* Database Options */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {databases.map(db => (
                <button
                  key={db.value}
                  onClick={() => changeDatabase(db.value)}
                  disabled={isChanging || currentDb === db.value}
                  style={{
                    padding: '16px',
                    background: currentDb === db.value ? `${db.color}15` : 'var(--background-secondary)',
                    border: currentDb === db.value ? `2px solid ${db.color}` : '2px solid transparent',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: currentDb === db.value ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    opacity: isChanging ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (currentDb !== db.value && !isChanging) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: '32px' }}>{db.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '600',
                      color: currentDb === db.value ? db.color : 'var(--text-primary)',
                      marginBottom: '4px'
                    }}>
                      {db.label}
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-secondary)'
                    }}>
                      {db.description}
                    </div>
                  </div>
                  {currentDb === db.value && (
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: db.color,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Loading indicator */}
            {isChanging && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'var(--info-color-light)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--info-color)'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid var(--info-color)',
                  borderTop: '3px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  Changement en cours...
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
