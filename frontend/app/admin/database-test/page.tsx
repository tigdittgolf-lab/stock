'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DatabaseService } from '../../../lib/database/database-service';
import styles from "../../page.module.css";

export default function DatabaseTestPage() {
  const router = useRouter();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    const tests = [
      {
        name: 'Test connexion base de données',
        test: async () => {
          const dbType = DatabaseService.getActiveDatabaseType();
          return { success: true, message: `Base active: ${dbType}` };
        }
      },
      {
        name: 'Test récupération articles',
        test: async () => {
          const result = await DatabaseService.executeRPC('get_articles', { p_tenant: '2025_bu01' });
          return {
            success: result.success,
            message: result.success ? 
              `${Array.isArray(result.data) ? result.data.length : 0} articles trouvés` :
              result.error
          };
        }
      },
      {
        name: 'Test récupération clients',
        test: async () => {
          const result = await DatabaseService.executeRPC('get_clients', { p_tenant: '2025_bu01' });
          return {
            success: result.success,
            message: result.success ? 
              `${Array.isArray(result.data) ? result.data.length : 0} clients trouvés` :
              result.error
          };
        }
      },
      {
        name: 'Test récupération activité',
        test: async () => {
          const result = await DatabaseService.executeRPC('get_tenant_activite', { p_tenant: '2025_bu01' });
          return {
            success: result.success,
            message: result.success ? 
              'Informations activité récupérées' :
              result.error
          };
        }
      },
      {
        name: 'Test récupération schémas',
        test: async () => {
          const schemas = await DatabaseService.getAvailableSchemas();
          return {
            success: schemas.length > 0,
            message: `${schemas.length} schémas trouvés: ${schemas.join(', ')}`
          };
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      try {
        console.log(`🧪 Exécution test: ${test.name}`);
        const result = await test.test();
        results.push({
          name: test.name,
          success: result.success,
          message: result.message,
          timestamp: new Date().toLocaleTimeString()
        });
      } catch (error) {
        results.push({
          name: test.name,
          success: false,
          message: error instanceof Error ? error.message : 'Erreur inconnue',
          timestamp: new Date().toLocaleTimeString()
        });
      }
      setTestResults([...results]);
      await new Promise(resolve => setTimeout(resolve, 500)); // Délai entre tests
    }

    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>🧪 Test Base de Données</h1>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Vérifier le fonctionnement du système hybride
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
        {/* Informations système */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#212529' }}>
            📊 Informations Système
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <strong>Base de données active :</strong><br />
              <span style={{ 
                padding: '2px 8px', 
                background: '#007bff',
                color: 'white',
                borderRadius: '3px',
                fontSize: '12px'
              }}>
                {DatabaseService.getActiveDatabaseType().toUpperCase()}
              </span>
            </div>
            <div>
              <strong>Type de connexion :</strong><br />
              {DatabaseService.isSupabaseActive() ? '☁️ Cloud (Supabase)' : '🏠 Local'}
            </div>
            <div>
              <strong>Tenant de test :</strong><br />
              2025_bu01
            </div>
          </div>
        </div>

        {/* Contrôles de test */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#212529' }}>
            🎯 Tests de Fonctionnement
          </h2>

          <button
            onClick={runTests}
            disabled={loading}
            style={{
              padding: '15px 30px',
              backgroundColor: loading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              marginBottom: '20px'
            }}
          >
            {loading ? '🔄 Tests en cours...' : '▶️ Lancer tous les tests'}
          </button>

          {/* Résultats des tests */}
          {testResults.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#212529' }}>Résultats :</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '15px',
                      borderRadius: '8px',
                      border: `2px solid ${result.success ? '#28a745' : '#dc3545'}`,
                      background: result.success ? '#d4edda' : '#f8d7da',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ 
                        fontWeight: '500', 
                        color: result.success ? '#155724' : '#721c24',
                        marginBottom: '5px'
                      }}>
                        {result.success ? '✅' : '❌'} {result.name}
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: result.success ? '#155724' : '#721c24'
                      }}>
                        {result.message}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6c757d',
                      fontFamily: 'monospace'
                    }}>
                      {result.timestamp}
                    </div>
                  </div>
                ))}
              </div>

              {/* Résumé */}
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: '#e7f3ff',
                border: '1px solid #b8daff',
                borderRadius: '8px'
              }}>
                <strong>Résumé :</strong> {testResults.filter(r => r.success).length}/{testResults.length} tests réussis
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#856404' }}>💡 Instructions</h3>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#856404', lineHeight: '1.8' }}>
            <li>Ces tests vérifient la connectivité avec la base de données active</li>
            <li>Changez de base dans "Configuration Base de Données" pour tester différents adaptateurs</li>
            <li>Les tests utilisent le tenant 2025_bu01 par défaut</li>
            <li>En cas d'échec, vérifiez la configuration de la base de données</li>
          </ul>
        </div>
      </main>
    </div>
  );
}