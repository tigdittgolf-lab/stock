'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { databaseManager } from '../../../lib/database/database-manager';
import { DatabaseConfig, DatabaseType } from '../../../lib/database/types';
import styles from "../../page.module.css";

export default function DatabaseConfigPage() {
  const router = useRouter();
  const [activeConfig, setActiveConfig] = useState<DatabaseConfig | null>(null);
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [testConfig, setTestConfig] = useState<DatabaseConfig>({
    type: 'supabase',
    name: '',
    supabaseUrl: '',
    supabaseKey: '',
    host: 'localhost',
    port: 5432,
    database: 'stock_db',
    username: 'postgres',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  useEffect(() => {
    loadCurrentConfig();
    loadBackendStatus();
  }, []);

  const showMessage = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setMessage(null);
    } else {
      setMessage(msg);
      setError(null);
    }
    setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 5000);
  };

  const loadCurrentConfig = () => {
    const config = databaseManager.getActiveConfig();
    setActiveConfig(config);
    
    // CORRECTION: Synchroniser avec le statut backend réel
    if (backendStatus && backendStatus.type) {
      // Si le backend a un type différent de la config locale, utiliser le backend
      if (!config || config.type !== backendStatus.type) {
        const backendConfig = {
          type: backendStatus.type,
          name: backendStatus.type === 'supabase' ? 'Supabase Production' :
                backendStatus.type === 'mysql' ? 'MySQL Local' :
                backendStatus.type === 'postgresql' ? 'PostgreSQL Local' : 'Unknown',
          // Utiliser les valeurs par défaut selon le type
          ...(backendStatus.type === 'supabase' ? {
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            supabaseKey: ''
          } : backendStatus.type === 'mysql' ? {
            host: 'localhost',
            port: 3306,
            database: 'stock_local',
            username: 'root',
            password: ''
          } : {
            host: 'localhost',
            port: 5432,
            database: 'postgres',
            username: 'postgres',
            password: 'postgres'
          }),
          lastTested: backendStatus.timestamp
        };
        setActiveConfig(backendConfig);
        setTestConfig(backendConfig);
        return;
      }
    }
    
    if (config) {
      setTestConfig({
        ...config,
        password: '' // Ne pas afficher le mot de passe
      });
    }
  };

  const loadBackendStatus = async () => {
    try {
      const response = await fetch('http://localhost:3005/api/database-config');
      if (response.ok) {
        const data = await response.json();
        setBackendStatus(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du statut backend:', error);
    }
  };

  const handleTypeChange = (type: DatabaseType) => {
    // Configuration par défaut selon le type de base de données
    const defaultConfigs = {
      supabase: {
        type: 'supabase' as DatabaseType,
        name: 'Supabase Cloud',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        supabaseKey: '',
        host: '',
        port: 443,
        database: '',
        username: '',
        password: ''
      },
      postgresql: {
        type: 'postgresql' as DatabaseType,
        name: 'PostgreSQL Local',
        supabaseUrl: '',
        supabaseKey: '',
        host: 'localhost',
        port: 5432,
        database: 'postgres', // Base par défaut PostgreSQL
        username: 'postgres', // Utilisateur par défaut PostgreSQL
        password: 'postgres'  // Mot de passe par défaut PostgreSQL
      },
      mysql: {
        type: 'mysql' as DatabaseType,
        name: 'MySQL Local',
        supabaseUrl: '',
        supabaseKey: '',
        host: 'localhost',
        port: 3306,
        database: 'stock_local', // Base par défaut MySQL
        username: 'root',        // Utilisateur par défaut MySQL
        password: ''             // Mot de passe vide par défaut MySQL
      }
    };

    // Appliquer la configuration par défaut
    setTestConfig(defaultConfigs[type]);
    setTestResult(null);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      // CORRECTION: Tester via le backend au lieu du frontend
      const response = await fetch('http://localhost:3005/api/database-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testConfig)
      });
      
      const data = await response.json();
      const result = data.success;
      
      setTestResult(result);
      
      if (result) {
        showMessage('✅ Test de connexion réussi !');
      } else {
        showMessage(`❌ Test de connexion échoué: ${data.error}`, true);
      }
    } catch (error) {
      console.error('Erreur test:', error);
      setTestResult(false);
      showMessage('❌ Erreur lors du test de connexion', true);
    } finally {
      setTesting(false);
    }
  };

  const switchDatabase = async () => {
    if (!testResult) {
      showMessage('Veuillez d\'abord tester la connexion', true);
      return;
    }

    setLoading(true);
    
    try {
      // CORRECTION: Utiliser directement le backend au lieu du database manager
      const response = await fetch('http://localhost:3005/api/database-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testConfig)
      });
      
      const data = await response.json();
      const success = data.success;
      
      if (success) {
        showMessage('✅ Base de données changée avec succès !');
        loadCurrentConfig();
        loadBackendStatus(); // Recharger le statut backend
        
        // Recharger la page après un délai pour appliquer les changements
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        showMessage(`❌ Erreur lors du changement de base de données: ${data.error}`, true);
      }
    } catch (error) {
      console.error('Erreur switch:', error);
      showMessage('❌ Erreur lors du changement de base de données', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>🗄️ Configuration Base de Données</h1>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Gérer les connexions aux bases de données
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
            ← Retour Admin
          </button>
        </div>
      </header>

      <main className={styles.main} style={{ paddingTop: '40px' }}>
        {/* Messages */}
        {message && (
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #c3e6cb'
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {/* Configuration actuelle */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#212529' }}>
            📊 Configuration Actuelle
          </h2>
          
          {/* Statut Backend en temps réel */}
          {backendStatus && (
            <div style={{ 
              padding: '15px', 
              background: '#e3f2fd', 
              borderRadius: '5px',
              border: '1px solid #90caf9',
              marginBottom: '15px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ 
                  padding: '4px 12px', 
                  background: '#1976d2',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  🔴 BACKEND ACTIF
                </span>
                <span style={{ 
                  padding: '4px 12px', 
                  background: backendStatus.type === 'supabase' ? '#4caf50' : 
                             backendStatus.type === 'mysql' ? '#ff9800' : '#9c27b0',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {backendStatus.type?.toUpperCase() || 'INCONNU'}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#1565c0' }}>
                <strong>Base de données active :</strong> {backendStatus.type || 'Non définie'}<br />
                <strong>Dernière vérification :</strong> {new Date(backendStatus.timestamp).toLocaleString()}
              </div>
            </div>
          )}
          
          {activeConfig ? (
            <div style={{ 
              padding: '15px', 
              background: '#e8f5e8', 
              borderRadius: '5px',
              border: '1px solid #c3e6cb'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <div>
                  <strong>Type :</strong><br />
                  <span style={{ 
                    padding: '2px 8px', 
                    background: activeConfig.type === 'supabase' ? '#007bff' : 
                               activeConfig.type === 'mysql' ? '#fd7e14' : '#6f42c1',
                    color: 'white',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}>
                    {activeConfig.type.toUpperCase()}
                  </span>
                </div>
                <div>
                  <strong>Nom :</strong><br />
                  {activeConfig.name || 'Configuration par défaut'}
                </div>
                {activeConfig.type === 'supabase' ? (
                  <div>
                    <strong>URL Supabase :</strong><br />
                    {activeConfig.supabaseUrl?.substring(0, 30)}...
                  </div>
                ) : (
                  <>
                    <div>
                      <strong>Host :</strong><br />
                      {activeConfig.host}:{activeConfig.port}
                    </div>
                    <div>
                      <strong>Base :</strong><br />
                      {activeConfig.database}
                    </div>
                    <div>
                      <strong>Utilisateur :</strong><br />
                      {activeConfig.username}
                    </div>
                  </>
                )}
                <div>
                  <strong>Dernière vérification :</strong><br />
                  {activeConfig.lastTested ? 
                    new Date(activeConfig.lastTested).toLocaleString() : 
                    'Jamais testée'
                  }
                </div>
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: '15px', 
              background: '#fff3cd', 
              borderRadius: '5px',
              border: '1px solid #ffeaa7'
            }}>
              Aucune configuration active détectée
            </div>
          )}
        </div>

        {/* Configuration de test */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#212529' }}>
            🔧 Nouvelle Configuration
          </h2>

          {/* Sélecteur de type */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
              Type de base de données :
            </label>
            <div style={{ display: 'flex', gap: '15px' }}>
              {(['supabase', 'postgresql', 'mysql'] as DatabaseType[]).map((type) => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="dbType"
                    value={type}
                    checked={testConfig.type === type}
                    onChange={() => handleTypeChange(type)}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ 
                    padding: '5px 10px',
                    background: testConfig.type === type ? '#007bff' : '#f8f9fa',
                    color: testConfig.type === type ? 'white' : '#333',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    {type === 'supabase' ? '☁️ Supabase (Cloud)' : 
                     type === 'postgresql' ? '🐘 PostgreSQL (Local)' : 
                     type === 'mysql' ? '🐬 MySQL (Local)' : type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Champs de configuration */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Nom de la configuration
              </label>
              <input
                type="text"
                value={testConfig.name || ''}
                onChange={(e) => setTestConfig({...testConfig, name: e.target.value})}
                placeholder="Ex: Production Local"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px'
                }}
              />
            </div>

            {testConfig.type === 'supabase' ? (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    URL Supabase
                  </label>
                  <input
                    type="url"
                    value={testConfig.supabaseUrl || ''}
                    onChange={(e) => setTestConfig({...testConfig, supabaseUrl: e.target.value})}
                    placeholder="https://xxx.supabase.co"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Clé de service Supabase
                  </label>
                  <input
                    type="password"
                    value={testConfig.supabaseKey || ''}
                    onChange={(e) => setTestConfig({...testConfig, supabaseKey: e.target.value})}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Host
                  </label>
                  <input
                    type="text"
                    value={testConfig.host || ''}
                    onChange={(e) => setTestConfig({...testConfig, host: e.target.value})}
                    placeholder="localhost"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Port
                  </label>
                  <input
                    type="number"
                    value={testConfig.port || ''}
                    onChange={(e) => setTestConfig({...testConfig, port: parseInt(e.target.value)})}
                    placeholder={testConfig.type === 'mysql' ? '3306' : '5432'}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Base de données
                  </label>
                  <input
                    type="text"
                    value={testConfig.database || ''}
                    onChange={(e) => setTestConfig({...testConfig, database: e.target.value})}
                    placeholder="stock_db"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Utilisateur
                  </label>
                  <input
                    type="text"
                    value={testConfig.username || ''}
                    onChange={(e) => setTestConfig({...testConfig, username: e.target.value})}
                    placeholder="postgres"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={testConfig.password || ''}
                    onChange={(e) => setTestConfig({...testConfig, password: e.target.value})}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Résultat du test */}
          {testResult !== null && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              borderRadius: '4px',
              background: testResult ? '#d4edda' : '#f8d7da',
              border: `1px solid ${testResult ? '#c3e6cb' : '#f5c6cb'}`,
              color: testResult ? '#155724' : '#721c24'
            }}>
              {testResult ? '✅ Connexion réussie !' : '❌ Connexion échouée'}
            </div>
          )}

          {/* Boutons d'action */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={testConnection}
              disabled={testing}
              style={{
                padding: '12px 24px',
                backgroundColor: testing ? '#6c757d' : '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: testing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {testing ? '🔄 Test en cours...' : '🧪 Tester la connexion'}
            </button>

            <button
              onClick={switchDatabase}
              disabled={loading || !testResult}
              style={{
                padding: '12px 24px',
                backgroundColor: loading || !testResult ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading || !testResult ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {loading ? '🔄 Changement...' : '🔄 Changer de base'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          background: '#e7f3ff',
          border: '1px solid #b8daff',
          padding: '15px',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#004085' }}>💡 Instructions</h3>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#004085' }}>
            <li><strong>Supabase :</strong> Utilisez l'URL et la clé de service de votre projet</li>
            <li><strong>PostgreSQL Local :</strong> Valeurs par défaut - Host: localhost, Port: 5432, DB: postgres, User: postgres</li>
            <li><strong>MySQL Local :</strong> Valeurs par défaut - Host: localhost, Port: 3306, DB: stock_local, User: root</li>
            <li><strong>Auto-remplissage :</strong> Les champs se remplissent automatiquement selon le type sélectionné</li>
            <li><strong>Test obligatoire :</strong> Testez toujours avant de changer de base</li>
            <li><strong>Statut temps réel :</strong> Le statut backend montre la base actuellement active</li>
          </ul>
        </div>
      </main>
    </div>
  );
}