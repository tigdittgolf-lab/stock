'use client';

import { useState, useEffect } from 'react';
import { DatabaseService } from '@/lib/database/database-service';

interface DatabaseTypeIndicatorProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function DatabaseTypeIndicator({ className, style }: DatabaseTypeIndicatorProps) {
  const [databaseType, setDatabaseType] = useState<string>('supabase');
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    synced: boolean;
    frontendType: string;
    backendType: string;
  } | null>(null);

  useEffect(() => {
    const detectDatabaseType = async () => {
      try {
        // CORRECTION: Interroger le backend directement au lieu du localStorage
        const response = await fetch('http://localhost:3005/api/database-config');
        if (response.ok) {
          const data = await response.json();
          const backendType = data.data.type;
          setDatabaseType(backendType);
          
          // Vérifier la synchronisation avec le frontend
          const frontendType = DatabaseService.getActiveDatabaseType();
          const isSync = frontendType === backendType;
          
          setSyncStatus({ 
            synced: isSync, 
            frontendType, 
            backendType 
          });
          
          // AUTO-CORRECTION: Si pas synchronisé, corriger automatiquement
          if (!isSync) {
            console.log(`🔧 Auto-correction: Frontend (${frontendType}) → Backend (${backendType})`);
            setIsAutoFixing(true);
            await autoFixSynchronization(backendType);
            setIsAutoFixing(false);
          }
        } else {
          throw new Error('Backend non accessible');
        }
      } catch (error) {
        console.error('Erreur détection type base de données:', error);
        // Fallback: utiliser le type frontend
        const frontendType = DatabaseService.getActiveDatabaseType();
        setDatabaseType(frontendType);
        setSyncStatus({ synced: true, frontendType, backendType: frontendType });
      } finally {
        setIsLoading(false);
      }
    };

    const autoFixSynchronization = async (correctBackendType: string) => {
      try {
        console.log(`🔄 Auto-correction vers ${correctBackendType}...`);
        
        // Obtenir la configuration par défaut pour le type backend
        const defaultConfigs = {
          supabase: {
            type: 'supabase',
            name: 'Supabase Production',
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co'
          },
          postgresql: {
            type: 'postgresql',
            name: 'PostgreSQL Local',
            host: 'localhost',
            port: 5432,
            database: 'postgres',
            username: 'postgres',
            password: 'postgres'
          },
          mysql: {
            type: 'mysql',
            name: 'MySQL Local',
            host: 'localhost',
            port: 3306,
            database: 'stock_local',
            username: 'root',
            password: ''
          }
        };
        
        const correctConfig = defaultConfigs[correctBackendType as keyof typeof defaultConfigs];
        
        if (correctConfig) {
          // Mettre à jour le localStorage frontend pour qu'il corresponde au backend
          if (typeof window !== 'undefined') {
            localStorage.setItem('activeDbConfig', JSON.stringify({
              ...correctConfig,
              isActive: true,
              lastTested: new Date().toISOString()
            }));
            console.log(`✅ Frontend synchronisé avec ${correctBackendType}`);
            
            // Mettre à jour l'état local
            setSyncStatus({ 
              synced: true, 
              frontendType: correctBackendType, 
              backendType: correctBackendType 
            });
          }
        }
      } catch (error) {
        console.error('❌ Erreur auto-correction:', error);
      }
    };

    detectDatabaseType();

    // Recharger toutes les 10 secondes pour rester synchronisé
    const interval = setInterval(detectDatabaseType, 10000);

    // Écouter les changements de configuration de base de données
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'activeDbConfig') {
        detectDatabaseType();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }

    return () => clearInterval(interval);
  }, []);

  const getDatabaseInfo = (type: string) => {
    switch (type) {
      case 'supabase':
        return {
          icon: '☁️',
          name: 'Supabase',
          description: 'Cloud PostgreSQL',
          color: '#3ecf8e',
          bgColor: '#f0fdf4'
        };
      case 'postgresql':
        return {
          icon: '🐘',
          name: 'PostgreSQL',
          description: 'Local',
          color: '#336791',
          bgColor: '#f0f9ff'
        };
      case 'mysql':
        return {
          icon: '🐬',
          name: 'MySQL',
          description: 'Local',
          color: '#f29111',
          bgColor: '#fffbeb'
        };
      default:
        return {
          icon: '❓',
          name: 'Inconnu',
          description: 'Type inconnu',
          color: '#6b7280',
          bgColor: '#f9fafb'
        };
    }
  };

  if (isLoading) {
    return (
      <div 
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: '#f3f4f6',
          border: '1px solid #e5e7eb',
          fontSize: '14px',
          color: '#6b7280',
          ...style
        }}
      >
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <span>Détection...</span>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const dbInfo = getDatabaseInfo(databaseType);
  const isNotSynced = syncStatus && !syncStatus.synced && !isAutoFixing;

  // Si auto-correction en cours, afficher un message spécial
  if (isAutoFixing) {
    return (
      <div 
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          fontSize: '14px',
          color: '#856404',
          ...style
        }}
      >
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid #ffc107',
          borderTop: '2px solid #856404',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '13px' }}>
            🔧 Auto-correction
          </span>
          <span style={{ fontSize: '11px', opacity: 0.8 }}>
            Synchronisation en cours...
          </span>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '6px',
        backgroundColor: isNotSynced ? '#fef3c7' : dbInfo.bgColor,
        border: `1px solid ${isNotSynced ? '#f59e0b' : dbInfo.color}20`,
        fontSize: '14px',
        fontWeight: '500',
        color: isNotSynced ? '#92400e' : dbInfo.color,
        ...style
      }}
      title={
        isNotSynced 
          ? `⚠️ ATTENTION: Frontend utilise ${syncStatus?.frontendType}, Backend utilise ${syncStatus?.backendType}. Les données peuvent ne pas être cohérentes !`
          : `Base de données active: ${dbInfo.name} (${dbInfo.description})`
      }
    >
      <span style={{ fontSize: '16px' }}>
        {dbInfo.icon}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '13px' }}>
          {dbInfo.name}
        </span>
        <span style={{ fontSize: '11px', opacity: 0.8 }}>
          {isNotSynced 
            ? `⚠️ Non Synchronisé (F:${syncStatus?.frontendType} ≠ B:${syncStatus?.backendType})`
            : dbInfo.description
          }
        </span>
      </div>
      <div 
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isNotSynced ? '#f59e0b' : dbInfo.color,
          marginLeft: '4px'
        }}
        title={isNotSynced ? 'Bases de données non synchronisées' : 'Connexion active'}
      ></div>
    </div>
  );
}