'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from "../../page.module.css";

type DatabaseType = 'supabase' | 'postgresql' | 'mysql';

interface DatabaseConfig {
  type: DatabaseType;
  name: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export default function DatabaseConfigPage() {
  const router = useRouter();
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<DatabaseType>('supabase');
  const [config, setConfig] = useState<DatabaseConfig>({
    type: 'supabase',
    name: 'Supabase Production'
  });
  
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  useEffect(() => {
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

  const loadBackendStatus = async () => {
    try {
      // Utiliser l'API frontend qui redirige vers le backend via tunnel
      const response = await fetch('/api/database/status');
      if (response.ok) {
        const data = await response.json();
        
        // Créer un objet de statut compatible avec l'interface
        const statusData = {
          type: data.currentType,
          timestamp: data.timestamp
        };
        
        setBackendStatus(statusData);
        
        // Initialiser l'interface avec le type backend actuel
        if (data.currentType) {
          setSelectedType(data.currentType);
          setConfig(getDefaultConfig(data.currentType));
        }
      }
    } catch (error) {
      console.error('Erreur chargement statut backend:', error);
    }
  };

  const getDefaultConfig = (type: DatabaseType): DatabaseConfig => {
    const configs = {
      supabase: {
        type: 'supabase' as DatabaseType,
        name: 'Supabase Production',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co',
        supabaseKey: ''
      },
      postgresql: {
        type: 'postgresql' as DatabaseType,
        name: 'PostgreSQL Local',
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        username: 'postgres',
        password: 'postgres'
      },
      mysql: {
        type: 'mysql' as DatabaseType,
        name: 'MySQL Local',
        host: 'localhost',
        port: 3306,
        database: 'stock_local',
        username: 'root',
        password: ''
      }
    };
    return configs[type];
  };

  const handleTypeChange = (type: DatabaseType) => {
    setSelectedType(type);
    setConfig(getDefaultConfig(type));
    setTestResult(null);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      // Utiliser l'API via tunnel au lieu de localhost direct
      const response = await fetch('/api/database/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTestResult(true);
        showMessage('✅ Test de connexion réussi !');
      } else {
        setTestResult(false);
        showMessage(`❌ Test échoué: ${data.error}`, true);
      }
    } catch (error) {
      setTestResult(false);
      showMessage('❌ Erreur lors du test de connexion', true);
    } finally {
      setTesting(false);
    }
  };

  const switchDatabase = async () => {
    // Permettre le switch même sans test réussi
    setLoading(true);
    
    try {
      // Utiliser l'API via tunnel au lieu de localhost direct
      const response = await fetch('/api/database/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage('✅ Base de données changée avec succès !');
        
        // Recharger le statut sans vider le cache d'authentification
        await loadBackendStatus();
        
        // Rediriger vers le dashboard après 2 secondes
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        showMessage(`❌ Erreur: ${data.error}`, true);
      }
    } catch (error) {
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
              Changer la base de données active du système
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

      <main className={styles.main} style={{ paddingTop: '120px' }}>
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

        {/* Statut actuel */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#212529' }}>
            📊 Base de Données Actuellement Active
          </h2>
          
          {backendStatus ? (
            <div style={{ 
              padding: '20px', 
              background: '#e8f5e8', 
              borderRadius: '8px',
              border: '2px solid #28a745'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                <span style={{ 
                  padding: '8px 16px', 
                  background: '#28a745',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  🟢 ACTIF
                </span>
                <span style={{ 
                  padding: '8px 16px', 
                  background: backendStatus.type === 'supabase' ? '#007bff' : 
                             backendStatus.type === 'mysql' ? '#fd7e14' : '#6f42c1',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {backendStatus.type?.toUpperCase() || 'INCONNU'}
                </span>
              </div>
              <div style={{ fontSize: '16px', color: '#155724' }}>
                <strong>Type :</strong> {backendStatus.type || 'Non défini'}<br />
                <strong>Statut :</strong> Connecté et fonctionnel<br />
                <strong>Dernière vérification :</strong> {new Date(backendStatus.timestamp).toLocaleString()}
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: '20px', 
              background: '#fff3cd', 
              borderRadius: '8px',
              border: '2px solid #ffc107'
            }}>
              <span style={{ 
                padding: '8px 16px', 
                background: '#ffc107',
                color: '#212529',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                ⚠️ CHARGEMENT...
              </span>
              <div style={{ marginTop: '10px', fontSize: '16px' }}>
                Récupération du statut de la base de données...
              </div>
            </div>
          )}
        </div>

        {/* Sélection nouvelle base */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#212529' }}>
            🔄 Changer de Base de Données
          </h2>

          {/* Sélecteur de type */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '15px', fontWeight: '600', fontSize: '16px' }}>
              Choisir le type de base de données :
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              {(['supabase', 'postgresql', 'mysql'] as DatabaseType[]).map((type) => (
                <label key={type} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: '15px',
                  border: `2px solid ${selectedType === type ? '#007bff' : '#dee2e6'}`,
                  borderRadius: '8px',
                  background: selectedType === type ? '#f8f9ff' : '#fff'
                }}>
                  <input
                    type="radio"
                    name="dbType"
                    value={type}
                    checked={selectedType === type}
                    onChange={() => handleTypeChange(type)}
                    style={{ marginRight: '12px', transform: 'scale(1.2)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {type === 'supabase' ? '☁️ Supabase (Cloud)' : 
                       type === 'postgresql' ? '🐘 PostgreSQL (Local)' : 
                       '🐬 MySQL (Local)'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {type === 'supabase' ? 'Base de données cloud' : 
                       type === 'postgresql' ? 'postgres:postgres@localhost:5432' : 
                       'root@localhost:3306'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Configuration détaillée */}
          <div style={{ 
            padding: '20px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>
              Configuration : {config.name}
            </h3>
            
            {selectedType === 'supabase' ? (
              <div style={{ display: 'grid', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    URL Supabase
                  </label>
                  <input
                    type="url"
                    value={config.supabaseUrl || ''}
                    onChange={(e) => setConfig({...config, supabaseUrl: e.target.value})}
                    placeholder="https://xxx.supabase.co"
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
                    Clé de service (optionnel pour test)
                  </label>
                  <input
                    type="password"
                    value={config.supabaseKey || ''}
                    onChange={(e) => setConfig({...config, supabaseKey: e.target.value})}
                    placeholder="Laisser vide pour utiliser les variables d'environnement"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Host</label>
                  <input
                    type="text"
                    value={config.host || ''}
                    onChange={(e) => setConfig({...config, host: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Port</label>
                  <input
                    type="number"
                    value={config.port || ''}
                    onChange={(e) => setConfig({...config, port: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Base de données</label>
                  <input
                    type="text"
                    value={config.database || ''}
                    onChange={(e) => setConfig({...config, database: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Utilisateur</label>
                  <input
                    type="text"
                    value={config.username || ''}
                    onChange={(e) => setConfig({...config, username: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mot de passe</label>
                  <input
                    type="password"
                    value={config.password || ''}
                    onChange={(e) => setConfig({...config, password: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: '4px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Résultat du test */}
          {testResult !== null && (
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              borderRadius: '8px',
              background: testResult ? '#d4edda' : '#f8d7da',
              border: `2px solid ${testResult ? '#28a745' : '#dc3545'}`,
              color: testResult ? '#155724' : '#721c24'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>
                  {testResult ? '✅' : '❌'}
                </span>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                  {testResult ? 'Test de connexion réussi !' : 'Test de connexion échoué'}
                </span>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button
              onClick={testConnection}
              disabled={testing}
              style={{
                padding: '15px 30px',
                backgroundColor: testing ? '#6c757d' : '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: testing ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              {testing ? '🔄 Test en cours...' : '🧪 Tester la Connexion'}
            </button>

            <button
              onClick={switchDatabase}
              disabled={loading}
              style={{
                padding: '15px 30px',
                backgroundColor: loading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              {loading ? '🔄 Changement...' : '✅ Changer de Base'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          background: '#e7f3ff',
          border: '1px solid #b8daff',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#004085' }}>💡 Instructions</h3>
          <div style={{ color: '#004085', lineHeight: '1.6' }}>
            <p><strong>1. Choisissez le type</strong> de base de données (les champs se remplissent automatiquement)</p>
            <p><strong>2. Testez la connexion</strong> pour vérifier que la configuration fonctionne</p>
            <p><strong>3. Changez de base</strong> une fois le test réussi</p>
            <p><strong>Note :</strong> Le changement est immédiat et affecte toute l'application</p>
          </div>
        </div>
      </main>
    </div>
  );
}