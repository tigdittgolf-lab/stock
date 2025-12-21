'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MigrationService, MigrationProgress, MigrationOptions } from '../../../lib/database/migration-service';
import { DatabaseConfig, DatabaseType } from '../../../lib/database/types';
import { databaseManager } from '../../../lib/database/database-manager';
import styles from "../../page.module.css";

export default function DatabaseMigrationPage() {
  const router = useRouter();
  const [sourceConfig, setSourceConfig] = useState<DatabaseConfig>({
    type: 'supabase',
    name: 'Source',
    supabaseUrl: 'https://szgodrjglbpzkrksnroi.supabase.co',
    supabaseKey: '',
    host: 'localhost',
    port: 5432,
    database: 'stock_db',
    username: 'postgres',
    password: ''
  });

  const [targetConfig, setTargetConfig] = useState<DatabaseConfig>({
    type: 'postgresql',
    name: 'Target',
    supabaseUrl: '',
    supabaseKey: '',
    host: 'localhost',
    port: 5432,
    database: 'stock_local',
    username: 'postgres',
    password: ''
  });

  const [migrationOptions, setMigrationOptions] = useState<MigrationOptions>({
    includeSchema: true,
    includeData: true,
    overwriteExisting: false,
    batchSize: 100
  });

  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');

  useEffect(() => {
    // Charger la configuration actuelle comme source par défaut
    const activeConfig = databaseManager.getActiveConfig();
    if (activeConfig) {
      setSourceConfig(activeConfig);
    }
  }, []);

  const handleSourceTypeChange = (type: DatabaseType) => {
    setSourceConfig({
      ...sourceConfig,
      type,
      name: `Source ${type}`,
      port: type === 'mysql' ? 3306 : 5432
    });
  };

  const handleTargetTypeChange = (type: DatabaseType) => {
    setTargetConfig({
      ...targetConfig,
      type,
      name: `Target ${type}`,
      port: type === 'mysql' ? 3306 : 5432
    });
  };

  const startMigration = async () => {
    // Désactiver la migration automatique - pas nécessaire pour cette application
    alert('⚠️ Migration désactivée\n\nVotre application fonctionne déjà parfaitement avec Supabase.\nAucune migration n\'est nécessaire.\n\nSi vous souhaitez vraiment effectuer une migration, contactez l\'administrateur système.');
    return;

    setIsRunning(true);
    setMigrationProgress([]);
    setCurrentStep('Initialisation...');

    const migrationService = new MigrationService((progress: MigrationProgress) => {
      setMigrationProgress(prev => [...prev, progress]);
      setCurrentStep(progress.message);
    });

    try {
      // Lancer la migration via API
      const success = await migrationService.migrate(sourceConfig, targetConfig, migrationOptions);
      
      if (success) {
        setCurrentStep('✅ Migration terminée avec succès !');
      } else {
        setCurrentStep('❌ Migration échouée');
      }
    } catch (error) {
      console.error('Erreur migration:', error);
      setCurrentStep(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getProgressPercentage = () => {
    if (migrationProgress.length === 0) return 0;
    const lastProgress = migrationProgress[migrationProgress.length - 1];
    return Math.round((lastProgress.progress / lastProgress.total) * 100);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>🔄 Migration de Base de Données</h1>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Migrer automatiquement les données entre bases de données
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
        {/* Configuration Source */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#212529' }}>
            📤 Base de Données Source
          </h2>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
              Type de base source :
            </label>
            <div style={{ display: 'flex', gap: '15px' }}>
              {(['supabase', 'postgresql', 'mysql'] as DatabaseType[]).map((type) => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="sourceType"
                    value={type}
                    checked={sourceConfig.type === type}
                    onChange={() => handleSourceTypeChange(type)}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ 
                    padding: '5px 10px',
                    background: sourceConfig.type === type ? '#007bff' : '#f8f9fa',
                    color: sourceConfig.type === type ? 'white' : '#333',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    {type === 'supabase' ? '☁️ Supabase' : 
                     type === 'postgresql' ? '🐘 PostgreSQL' : '🐬 MySQL'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            {sourceConfig.type === 'supabase' ? (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    URL Supabase
                  </label>
                  <input
                    type="url"
                    value={sourceConfig.supabaseUrl || ''}
                    onChange={(e) => setSourceConfig({...sourceConfig, supabaseUrl: e.target.value})}
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
                    Clé Supabase
                  </label>
                  <input
                    type="password"
                    value={sourceConfig.supabaseKey || ''}
                    onChange={(e) => setSourceConfig({...sourceConfig, supabaseKey: e.target.value})}
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
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Host</label>
                  <input
                    type="text"
                    value={sourceConfig.host || ''}
                    onChange={(e) => setSourceConfig({...sourceConfig, host: e.target.value})}
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
                    value={sourceConfig.port || ''}
                    onChange={(e) => setSourceConfig({...sourceConfig, port: parseInt(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Base</label>
                  <input
                    type="text"
                    value={sourceConfig.database || ''}
                    onChange={(e) => setSourceConfig({...sourceConfig, database: e.target.value})}
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
                    value={sourceConfig.username || ''}
                    onChange={(e) => setSourceConfig({...sourceConfig, username: e.target.value})}
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
                    value={sourceConfig.password || ''}
                    onChange={(e) => setSourceConfig({...sourceConfig, password: e.target.value})}
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
        </div>

        {/* Configuration Cible */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#212529' }}>
            📥 Base de Données Cible
          </h2>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
              Type de base cible :
            </label>
            <div style={{ display: 'flex', gap: '15px' }}>
              {(['supabase', 'postgresql', 'mysql'] as DatabaseType[]).map((type) => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="targetType"
                    value={type}
                    checked={targetConfig.type === type}
                    onChange={() => handleTargetTypeChange(type)}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ 
                    padding: '5px 10px',
                    background: targetConfig.type === type ? '#28a745' : '#f8f9fa',
                    color: targetConfig.type === type ? 'white' : '#333',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    {type === 'supabase' ? '☁️ Supabase' : 
                     type === 'postgresql' ? '🐘 PostgreSQL' : '🐬 MySQL'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            {targetConfig.type === 'supabase' ? (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    URL Supabase
                  </label>
                  <input
                    type="url"
                    value={targetConfig.supabaseUrl || ''}
                    onChange={(e) => setTargetConfig({...targetConfig, supabaseUrl: e.target.value})}
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
                    Clé Supabase
                  </label>
                  <input
                    type="password"
                    value={targetConfig.supabaseKey || ''}
                    onChange={(e) => setTargetConfig({...targetConfig, supabaseKey: e.target.value})}
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
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Host</label>
                  <input
                    type="text"
                    value={targetConfig.host || ''}
                    onChange={(e) => setTargetConfig({...targetConfig, host: e.target.value})}
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
                    value={targetConfig.port || ''}
                    onChange={(e) => setTargetConfig({...targetConfig, port: parseInt(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Base</label>
                  <input
                    type="text"
                    value={targetConfig.database || ''}
                    onChange={(e) => setTargetConfig({...targetConfig, database: e.target.value})}
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
                    value={targetConfig.username || ''}
                    onChange={(e) => setTargetConfig({...targetConfig, username: e.target.value})}
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
                    value={targetConfig.password || ''}
                    onChange={(e) => setTargetConfig({...targetConfig, password: e.target.value})}
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
        </div>

        {/* Options de Migration */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#212529' }}>
            ⚙️ Options de Migration
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={migrationOptions.includeSchema}
                  onChange={(e) => setMigrationOptions({...migrationOptions, includeSchema: e.target.checked})}
                  style={{ marginRight: '10px' }}
                />
                <span>Inclure la structure (schémas et tables)</span>
              </label>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={migrationOptions.includeData}
                  onChange={(e) => setMigrationOptions({...migrationOptions, includeData: e.target.checked})}
                  style={{ marginRight: '10px' }}
                />
                <span>Inclure les données</span>
              </label>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={migrationOptions.overwriteExisting}
                  onChange={(e) => setMigrationOptions({...migrationOptions, overwriteExisting: e.target.checked})}
                  style={{ marginRight: '10px' }}
                />
                <span>Écraser les données existantes</span>
              </label>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Taille des lots :
              </label>
              <input
                type="number"
                value={migrationOptions.batchSize}
                onChange={(e) => setMigrationOptions({...migrationOptions, batchSize: parseInt(e.target.value)})}
                min="10"
                max="1000"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Contrôles de Migration */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#212529' }}>
            🚀 Lancer la Migration
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={startMigration}
              disabled={isRunning}
              style={{
                padding: '15px 30px',
                backgroundColor: isRunning ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                marginRight: '15px'
              }}
            >
              {isRunning ? '🔄 Migration en cours...' : '▶️ Démarrer la Migration'}
            </button>

            {isRunning && (
              <div style={{ marginTop: '15px' }}>
                <div style={{ 
                  background: '#e9ecef', 
                  borderRadius: '10px', 
                  height: '20px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: 'linear-gradient(90deg, #007bff, #0056b3)',
                    height: '100%',
                    width: `${getProgressPercentage()}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  {currentStep} ({getProgressPercentage()}%)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Journal de Migration */}
        {migrationProgress.length > 0 && (
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#212529' }}>
              📋 Journal de Migration
            </h2>

            <div style={{ 
              maxHeight: '400px', 
              overflowY: 'auto',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              padding: '15px',
              background: '#f8f9fa'
            }}>
              {migrationProgress.map((progress, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px 12px',
                    marginBottom: '5px',
                    borderRadius: '4px',
                    background: progress.success ? '#d4edda' : '#f8d7da',
                    border: `1px solid ${progress.success ? '#c3e6cb' : '#f5c6cb'}`,
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                >
                  <span style={{ color: progress.success ? '#155724' : '#721c24' }}>
                    {progress.success ? '✅' : '❌'} [{progress.step}] {progress.message}
                  </span>
                  {progress.error && (
                    <div style={{ color: '#721c24', marginTop: '5px', fontSize: '12px' }}>
                      Erreur: {progress.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div style={{
          background: '#e7f3ff',
          border: '1px solid #b8daff',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#004085' }}>💡 Instructions</h3>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#004085', lineHeight: '1.8' }}>
            <li><strong>Source :</strong> Base de données d'origine (vos données actuelles)</li>
            <li><strong>Cible :</strong> Base de données de destination (où migrer)</li>
            <li><strong>Structure :</strong> Crée automatiquement les schémas et tables</li>
            <li><strong>Données :</strong> Copie tous les articles, clients, fournisseurs, etc.</li>
            <li><strong>Vérification :</strong> Contrôle automatique de l'intégrité des données</li>
            <li><strong>Sécurité :</strong> La migration ne modifie jamais la base source</li>
          </ul>
        </div>
      </main>
    </div>
  );
}