'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from "../../page.module.css";

interface DatabaseInfo {
  name: string;
  type: 'tenant' | 'other';
  tableCount: number;
  estimatedRows: number;
  error?: string;
}

interface DiscoveredDatabases {
  tenant: DatabaseInfo[];
  other: DatabaseInfo[];
  total: number;
}

export default function DatabaseMigrationPage() {
  const router = useRouter();
  
  // Source et destination
  const [sourceType, setSourceType] = useState<'mysql' | 'supabase' | 'postgresql'>('mysql');
  const [targetType, setTargetType] = useState<'mysql' | 'supabase' | 'postgresql'>('supabase');
  
  // Configuration MySQL
  const [mysqlConfig, setMysqlConfig] = useState({
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: ''
  });

  // Configuration PostgreSQL
  const [postgresConfig, setPostgresConfig] = useState({
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: '',
    database: 'postgres'
  });

  // Configuration Supabase
  const [supabaseConfig] = useState({
    url: 'https://szgodrjglbpzkrksnroi.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU'
  });

  // État
  const [discoveredDatabases, setDiscoveredDatabases] = useState<DiscoveredDatabases | null>(null);
  const [selectedDatabases, setSelectedDatabases] = useState<string[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<string[]>([]);

  // Découvrir les bases selon la source
  const discoverDatabases = async () => {
    setIsDiscovering(true);
    setDiscoveredDatabases(null);
    setSelectedDatabases([]);

    try {
      if (sourceType === 'mysql') {
        // Découvrir MySQL
        const response = await fetch('/api/admin/discover-mysql-databases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mysqlConfig)
        });

        const result = await response.json();

        if (result.success) {
          setDiscoveredDatabases(result.databases);
          setSelectedDatabases(result.databases.tenant.map((db: DatabaseInfo) => db.name));
        } else {
          alert(`Erreur: ${result.error}`);
        }
      } else if (sourceType === 'supabase') {
        // Découvrir Supabase
        const response = await fetch('/api/admin/discover-supabase-schemas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(supabaseConfig)
        });

        const result = await response.json();

        if (result.success) {
          setDiscoveredDatabases(result.databases);
          setSelectedDatabases(result.databases.tenant.map((db: DatabaseInfo) => db.name));
        } else {
          alert(`Erreur: ${result.error}`);
        }
      } else {
        // Découvrir PostgreSQL
        const response = await fetch('/api/admin/discover-postgresql-databases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postgresConfig)
        });

        const result = await response.json();

        if (result.success) {
          setDiscoveredDatabases(result.databases);
          setSelectedDatabases(result.databases.tenant.map((db: DatabaseInfo) => db.name));
        } else {
          alert(`Erreur: ${result.error}`);
        }
      }
    } catch (error) {
      alert(`Erreur de connexion: ${error}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Basculer la sélection d'une base
  const toggleDatabase = (dbName: string) => {
    setSelectedDatabases(prev =>
      prev.includes(dbName)
        ? prev.filter(name => name !== dbName)
        : [...prev, dbName]
    );
  };

  // Tester les connexions
  const testConnections = async () => {
    setIsTesting(true);
    setMigrationProgress([]);

    try {
      setMigrationProgress(prev => [...prev, '🧪 Test des connexions...']);

      // Construire la config source
      let sourceConfig;
      if (sourceType === 'mysql') {
        sourceConfig = {
          type: 'mysql',
          host: mysqlConfig.host,
          port: mysqlConfig.port,
          username: mysqlConfig.username,
          password: mysqlConfig.password,
          database: 'mysql'
        };
      } else if (sourceType === 'supabase') {
        sourceConfig = {
          type: 'supabase',
          supabaseUrl: supabaseConfig.url,
          supabaseKey: supabaseConfig.key
        };
      } else {
        sourceConfig = {
          type: 'postgresql',
          host: postgresConfig.host,
          port: postgresConfig.port,
          username: postgresConfig.username,
          password: postgresConfig.password,
          database: postgresConfig.database
        };
      }

      // Construire la config cible
      let targetConfig;
      if (targetType === 'mysql') {
        targetConfig = {
          type: 'mysql',
          host: mysqlConfig.host,
          port: mysqlConfig.port,
          username: mysqlConfig.username,
          password: mysqlConfig.password,
          database: 'mysql'
        };
      } else if (targetType === 'supabase') {
        targetConfig = {
          type: 'supabase',
          supabaseUrl: supabaseConfig.url,
          supabaseKey: supabaseConfig.key
        };
      } else {
        targetConfig = {
          type: 'postgresql',
          host: postgresConfig.host,
          port: postgresConfig.port,
          username: postgresConfig.username,
          password: postgresConfig.password,
          database: postgresConfig.database
        };
      }

      const response = await fetch('/api/admin/migration/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceConfig, targetConfig })
      });

      const result = await response.json();

      if (result.success) {
        setMigrationProgress(prev => [...prev, `✅ Source ${sourceType.toUpperCase()}: Connexion OK`]);
        setMigrationProgress(prev => [...prev, `✅ Cible ${targetType.toUpperCase()}: Connexion OK`]);
        setMigrationProgress(prev => [...prev, '']);
        setMigrationProgress(prev => [...prev, '🎯 Prêt pour la migration!']);
        alert('✅ Connexions OK! Vous pouvez lancer la migration.');
      } else {
        setMigrationProgress(prev => [...prev, `❌ ${result.error}`]);
        if (!result.sourceOk) {
          setMigrationProgress(prev => [...prev, `❌ Source ${sourceType.toUpperCase()}: Échec connexion`]);
        }
        if (!result.targetOk) {
          setMigrationProgress(prev => [...prev, `❌ Cible ${targetType.toUpperCase()}: Échec connexion`]);
        }
        alert(`❌ ${result.error}`);
      }
    } catch (error) {
      setMigrationProgress(prev => [...prev, `❌ Erreur: ${error}`]);
      alert(`Erreur: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Lancer la migration
  const startMigration = async () => {
    if (selectedDatabases.length === 0) {
      alert('Veuillez sélectionner au moins une base de données');
      return;
    }

    if (sourceType === targetType) {
      alert('La source et la destination doivent être différentes!');
      return;
    }

    setIsMigrating(true);
    setMigrationProgress([]);

    try {
      setMigrationProgress(prev => [...prev, '🚀 Démarrage de la migration...']);

      // Construire la config source
      let sourceConfig;
      if (sourceType === 'mysql') {
        sourceConfig = {
          type: 'mysql',
          host: mysqlConfig.host,
          port: mysqlConfig.port,
          username: mysqlConfig.username,
          password: mysqlConfig.password,
          database: 'mysql'
        };
      } else if (sourceType === 'supabase') {
        sourceConfig = {
          type: 'supabase',
          supabaseUrl: supabaseConfig.url,
          supabaseKey: supabaseConfig.key
        };
      } else {
        sourceConfig = {
          type: 'postgresql',
          host: postgresConfig.host,
          port: postgresConfig.port,
          username: postgresConfig.username,
          password: postgresConfig.password,
          database: postgresConfig.database
        };
      }

      // Construire la config cible
      let targetConfig;
      if (targetType === 'mysql') {
        targetConfig = {
          type: 'mysql',
          host: mysqlConfig.host,
          port: mysqlConfig.port,
          username: mysqlConfig.username,
          password: mysqlConfig.password,
          database: 'mysql'
        };
      } else if (targetType === 'supabase') {
        targetConfig = {
          type: 'supabase',
          supabaseUrl: supabaseConfig.url,
          supabaseKey: supabaseConfig.key
        };
      } else {
        targetConfig = {
          type: 'postgresql',
          host: postgresConfig.host,
          port: postgresConfig.port,
          username: postgresConfig.username,
          password: postgresConfig.password,
          database: postgresConfig.database
        };
      }

      // Options de migration
      const options = {
        includeSchema: true,
        includeData: true,
        overwriteExisting: true,
        batchSize: 100,
        tenants: selectedDatabases
      };

      setMigrationProgress(prev => [...prev, `📊 Migration de ${selectedDatabases.length} base(s) sélectionnée(s)`]);
      setMigrationProgress(prev => [...prev, `📤 Source: ${sourceType.toUpperCase()}`]);
      setMigrationProgress(prev => [...prev, `📥 Cible: ${targetType.toUpperCase()}`]);

      // Appel API de migration
      const response = await fetch('/api/admin/migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceConfig,
          targetConfig,
          options
        })
      });

      const result = await response.json();

      if (result.success) {
        setMigrationProgress(prev => [...prev, '']);
        setMigrationProgress(prev => [...prev, '✅ MIGRATION TERMINÉE AVEC SUCCÈS!']);
        setMigrationProgress(prev => [...prev, '']);
        
        // Afficher les logs de migration
        if (result.logs && result.logs.length > 0) {
          result.logs.forEach((log: any) => {
            const icon = log.success ? '✅' : '❌';
            setMigrationProgress(prev => [...prev, `${icon} ${log.step}: ${log.message}`]);
          });
        }

        if (result.summary) {
          setMigrationProgress(prev => [...prev, '']);
          setMigrationProgress(prev => [...prev, '📊 RÉSUMÉ:']);
          setMigrationProgress(prev => [...prev, `  • Étapes: ${result.summary.totalSteps}`]);
          setMigrationProgress(prev => [...prev, `  • Schéma: ${result.summary.includeSchema ? 'Oui' : 'Non'}`]);
          setMigrationProgress(prev => [...prev, `  • Données: ${result.summary.includeData ? 'Oui' : 'Non'}`]);
        }

        alert('✅ Migration terminée avec succès!');
      } else {
        setMigrationProgress(prev => [...prev, '']);
        setMigrationProgress(prev => [...prev, `❌ ERREUR: ${result.error}`]);
        
        if (result.details) {
          setMigrationProgress(prev => [...prev, `💡 Détails: ${result.details}`]);
        }

        // Afficher les logs même en cas d'erreur
        if (result.logs && result.logs.length > 0) {
          setMigrationProgress(prev => [...prev, '']);
          setMigrationProgress(prev => [...prev, '📋 Logs de migration:']);
          result.logs.forEach((log: any) => {
            const icon = log.success ? '✅' : '❌';
            setMigrationProgress(prev => [...prev, `${icon} ${log.step}: ${log.message}`]);
          });
        }

        alert(`❌ Erreur: ${result.error}`);
      }
    } catch (error) {
      setMigrationProgress(prev => [...prev, '']);
      setMigrationProgress(prev => [...prev, `❌ ERREUR CRITIQUE: ${error}`]);
      alert(`Erreur critique: ${error}`);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>🔄 Migration MySQL → Supabase</h1>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Découverte automatique et migration sélective
            </div>
          </div>
          <button 
            onClick={() => router.push('/admin')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Retour
          </button>
        </div>
      </header>

      <main className={styles.main} style={{ paddingTop: '120px' }}>
        {/* Sélection Source et Destination */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0' }}>🔄 Configuration de la migration</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center' }}>
            {/* Source */}
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '16px' }}>
                📤 Source
              </label>
              <select
                value={sourceType}
                onChange={(e) => {
                  const newSource = e.target.value as any;
                  setSourceType(newSource);
                  // Si source = target, changer target automatiquement
                  if (newSource === targetType) {
                    const alternatives = ['mysql', 'supabase', 'postgresql'].filter(t => t !== newSource);
                    setTargetType(alternatives[0] as any);
                  }
                  // Réinitialiser la découverte
                  setDiscoveredDatabases(null);
                  setSelectedDatabases([]);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  border: '2px solid #007bff',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="mysql">MySQL</option>
                <option value="supabase">Supabase</option>
                <option value="postgresql">PostgreSQL</option>
              </select>
            </div>

            {/* Flèche */}
            <div style={{ fontSize: '32px', color: '#007bff', fontWeight: 'bold' }}>
              →
            </div>

            {/* Destination */}
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '16px' }}>
                📥 Destination
              </label>
              <select
                value={targetType}
                onChange={(e) => {
                  const newTarget = e.target.value as any;
                  setTargetType(newTarget);
                  // Si source = target, changer source automatiquement
                  if (newTarget === sourceType) {
                    const alternatives = ['mysql', 'supabase', 'postgresql'].filter(t => t !== newTarget);
                    setSourceType(alternatives[0] as any);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  border: '2px solid #28a745',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="mysql">MySQL</option>
                <option value="supabase">Supabase</option>
                <option value="postgresql">PostgreSQL</option>
              </select>
            </div>
          </div>

          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#e7f3ff',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            <strong>💡 Migration:</strong> {sourceType.toUpperCase()} → {targetType.toUpperCase()}
          </div>
        </div>

        {/* Configuration Source */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0' }}>📤 Configuration {sourceType.toUpperCase()} (Source)</h2>
          
          {/* Configuration MySQL */}
          {sourceType === 'mysql' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Host</label>
                <input
                  type="text"
                  value={mysqlConfig.host}
                  onChange={(e) => setMysqlConfig({...mysqlConfig, host: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Port</label>
                <input
                  type="number"
                  value={mysqlConfig.port}
                  onChange={(e) => setMysqlConfig({...mysqlConfig, port: parseInt(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Utilisateur</label>
                <input
                  type="text"
                  value={mysqlConfig.username}
                  onChange={(e) => setMysqlConfig({...mysqlConfig, username: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mot de passe</label>
                <input
                  type="password"
                  value={mysqlConfig.password}
                  onChange={(e) => setMysqlConfig({...mysqlConfig, password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          )}

          {/* Configuration PostgreSQL */}
          {sourceType === 'postgresql' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Host</label>
                <input
                  type="text"
                  value={postgresConfig.host}
                  onChange={(e) => setPostgresConfig({...postgresConfig, host: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Port</label>
                <input
                  type="number"
                  value={postgresConfig.port}
                  onChange={(e) => setPostgresConfig({...postgresConfig, port: parseInt(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Utilisateur</label>
                <input
                  type="text"
                  value={postgresConfig.username}
                  onChange={(e) => setPostgresConfig({...postgresConfig, username: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mot de passe</label>
                <input
                  type="password"
                  value={postgresConfig.password}
                  onChange={(e) => setPostgresConfig({...postgresConfig, password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Base de données</label>
                <input
                  type="text"
                  value={postgresConfig.database}
                  onChange={(e) => setPostgresConfig({...postgresConfig, database: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          )}

          {/* Configuration Supabase */}
          {sourceType === 'supabase' && (
            <div style={{ padding: '15px', background: '#e7f3ff', borderRadius: '6px' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>URL:</strong> {supabaseConfig.url}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                Configuration Supabase prédéfinie
              </div>
            </div>
          )}

          <button
            onClick={discoverDatabases}
            disabled={isDiscovering}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              backgroundColor: isDiscovering ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isDiscovering ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              marginRight: '10px'
            }}
          >
            {isDiscovering ? '🔍 Découverte en cours...' : `🔍 Découvrir les bases ${sourceType.toUpperCase()}`}
          </button>

          <button
            onClick={testConnections}
            disabled={isTesting}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              backgroundColor: isTesting ? '#6c757d' : '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isTesting ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '500'
            }}
          >
            {isTesting ? '🧪 Test en cours...' : '🧪 Tester les connexions'}
          </button>
        </div>

        {/* Configuration Destination */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0' }}>📥 Configuration {targetType.toUpperCase()} (Destination)</h2>
            
          {/* Configuration MySQL */}
          {targetType === 'mysql' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Host</label>
                <input
                  type="text"
                  value={mysqlConfig.host}
                  onChange={(e) => setMysqlConfig({...mysqlConfig, host: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Port</label>
                <input
                  type="number"
                  value={mysqlConfig.port}
                  onChange={(e) => setMysqlConfig({...mysqlConfig, port: parseInt(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Utilisateur</label>
                <input
                  type="text"
                  value={mysqlConfig.username}
                  onChange={(e) => setMysqlConfig({...mysqlConfig, username: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mot de passe</label>
                <input
                  type="password"
                  value={mysqlConfig.password}
                  onChange={(e) => setMysqlConfig({...mysqlConfig, password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          )}

          {/* Configuration PostgreSQL */}
          {targetType === 'postgresql' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Host</label>
                <input
                  type="text"
                  value={postgresConfig.host}
                  onChange={(e) => setPostgresConfig({...postgresConfig, host: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Port</label>
                <input
                  type="number"
                  value={postgresConfig.port}
                  onChange={(e) => setPostgresConfig({...postgresConfig, port: parseInt(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Utilisateur</label>
                <input
                  type="text"
                  value={postgresConfig.username}
                  onChange={(e) => setPostgresConfig({...postgresConfig, username: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mot de passe</label>
                <input
                  type="password"
                  value={postgresConfig.password}
                  onChange={(e) => setPostgresConfig({...postgresConfig, password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Base de données</label>
                <input
                  type="text"
                  value={postgresConfig.database}
                  onChange={(e) => setPostgresConfig({...postgresConfig, database: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          )}

          {/* Configuration Supabase */}
          {targetType === 'supabase' && (
            <div style={{ padding: '15px', background: '#d4edda', borderRadius: '6px' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>URL:</strong> {supabaseConfig.url}
              </div>
              <div style={{ fontSize: '13px', color: '#155724' }}>
                Configuration Supabase prédéfinie
              </div>
            </div>
          )}
        </div>

        {/* Liste des bases découvertes */}
        {discoveredDatabases && (
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: '0 0 20px 0' }}>
              📊 Bases découvertes ({discoveredDatabases.total})
            </h2>

            {discoveredDatabases.tenant.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#28a745' }}>
                  ✅ Bases Tenant ({discoveredDatabases.tenant.length})
                </h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {discoveredDatabases.tenant.map((db) => (
                    <label
                      key={db.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '15px',
                        border: selectedDatabases.includes(db.name) ? '2px solid #007bff' : '1px solid #dee2e6',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: selectedDatabases.includes(db.name) ? '#e7f3ff' : 'white'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDatabases.includes(db.name)}
                        onChange={() => toggleDatabase(db.name)}
                        style={{ marginRight: '15px', width: '18px', height: '18px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '5px' }}>
                          {db.name}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          📋 {db.tableCount} tables • 📊 ~{db.estimatedRows.toLocaleString()} enregistrements
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {discoveredDatabases.other.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 15px 0', color: '#6c757d' }}>
                  ℹ️ Autres bases ({discoveredDatabases.other.length})
                </h3>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {discoveredDatabases.other.map(db => db.name).join(', ')}
                </div>
              </div>
            )}

            <div style={{ marginTop: '25px', padding: '15px', background: '#fff3cd', borderRadius: '6px' }}>
              <strong>💡 Sélection:</strong> {selectedDatabases.length} base(s) sélectionnée(s)
            </div>
          </div>
        )}

        {/* Bouton de migration */}
        {selectedDatabases.length > 0 && (
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: '0 0 20px 0' }}>🚀 Lancer la migration</h2>
            
            {/* Avertissement */}
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              padding: '15px',
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <strong>⚠️ ATTENTION:</strong>
              <ul style={{ margin: '10px 0 0 20px', paddingLeft: '0' }}>
                <li>Cette opération va créer/écraser les schémas dans Supabase</li>
                <li>Toutes les données existantes seront remplacées</li>
                <li>La migration peut prendre plusieurs minutes</li>
                <li>Ne fermez pas cette page pendant la migration</li>
              </ul>
            </div>
            
            <button
              onClick={startMigration}
              disabled={isMigrating}
              style={{
                padding: '15px 30px',
                backgroundColor: isMigrating ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isMigrating ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              {isMigrating ? '⏳ Migration en cours...' : `▶️ Migrer ${selectedDatabases.length} base(s)`}
            </button>

            {migrationProgress.length > 0 && (
              <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '6px', maxHeight: '400px', overflowY: 'auto' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>📋 Progression</h3>
                {migrationProgress.map((msg, i) => (
                  <div key={i} style={{ fontSize: '14px', marginBottom: '5px', fontFamily: 'monospace' }}>
                    {msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div style={{
          background: '#e7f3ff',
          border: '1px solid #b8daff',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#004085' }}>💡 Comment ça marche?</h3>
          <ol style={{ margin: '0', paddingLeft: '20px', color: '#004085', lineHeight: '1.8' }}>
            <li>Configurez les paramètres de connexion MySQL</li>
            <li>Cliquez sur "Découvrir" pour lister toutes les bases</li>
            <li>Sélectionnez les bases à migrer (tenant: YYYY_buXX)</li>
            <li>Lancez la migration vers Supabase</li>
            <li>Suivez la progression en temps réel</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
