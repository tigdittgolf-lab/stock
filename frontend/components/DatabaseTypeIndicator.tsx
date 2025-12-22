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
  const [syncStatus, setSyncStatus] = useState<{
    synced: boolean;
    frontendType: string;
    backendType: string;
  } | null>(null);

  useEffect(() => {
    const detectDatabaseType = async () => {
      try {
        const dbType = DatabaseService.getActiveDatabaseType();
        setDatabaseType(dbType);
        setSyncStatus({ synced: true, frontendType: dbType, backendType: dbType });
      } catch (error) {
        console.error('Erreur détection type base de données:', error);
        setDatabaseType('supabase'); // Fallback
        setSyncStatus({ synced: true, frontendType: 'supabase', backendType: 'supabase' });
      } finally {
        setIsLoading(false);
      }
    };

    detectDatabaseType();

    // Écouter les changements de configuration de base de données
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'activeDbConfig') {
        detectDatabaseType();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
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
  const isNotSynced = syncStatus && !syncStatus.synced;

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
        {isNotSynced ? '⚠️' : dbInfo.icon}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '13px' }}>
          {isNotSynced ? 'Non Synchronisé' : dbInfo.name}
        </span>
        <span style={{ fontSize: '11px', opacity: 0.8 }}>
          {isNotSynced 
            ? `F:${syncStatus?.frontendType} ≠ B:${syncStatus?.backendType}`
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