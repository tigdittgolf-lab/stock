'use client';

import { useState } from 'react';

export default function TestLocalPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState<string>('');

  const testBackend = async () => {
    setLoading('backend');
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setResults(prev => ({ ...prev, backend: { success: true, data } }));
    } catch (error) {
      setResults(prev => ({ ...prev, backend: { success: false, error: error.message } }));
    }
    setLoading('');
  };

  const testDatabase = async () => {
    setLoading('database');
    try {
      const response = await fetch('/api/database/status', {
        headers: { 'X-Tenant': '2025_bu01' }
      });
      const data = await response.json();
      setResults(prev => ({ ...prev, database: data }));
    } catch (error) {
      setResults(prev => ({ ...prev, database: { success: false, error: error.message } }));
    }
    setLoading('');
  };

  const testSuppliers = async () => {
    setLoading('suppliers');
    try {
      const response = await fetch('/api/sales/suppliers', {
        headers: { 'X-Tenant': '2025_bu01' }
      });
      const data = await response.json();
      setResults(prev => ({ ...prev, suppliers: data }));
    } catch (error) {
      setResults(prev => ({ ...prev, suppliers: { success: false, error: error.message } }));
    }
    setLoading('');
  };

  const testArticles = async () => {
    setLoading('articles');
    try {
      const response = await fetch('/api/sales/articles', {
        headers: { 'X-Tenant': '2025_bu01' }
      });
      const data = await response.json();
      setResults(prev => ({ ...prev, articles: data }));
    } catch (error) {
      setResults(prev => ({ ...prev, articles: { success: false, error: error.message } }));
    }
    setLoading('');
  };

  const testClients = async () => {
    setLoading('clients');
    try {
      const response = await fetch('/api/sales/clients', {
        headers: { 'X-Tenant': '2025_bu01' }
      });
      const data = await response.json();
      setResults(prev => ({ ...prev, clients: data }));
    } catch (error) {
      setResults(prev => ({ ...prev, clients: { success: false, error: error.message } }));
    }
    setLoading('');
  };

  const ResultDisplay = ({ title, result, isLoading }: any) => (
    <div style={{ 
      margin: '20px 0', 
      padding: '15px', 
      border: '1px solid #ddd', 
      borderRadius: '5px',
      backgroundColor: result?.success ? '#d4edda' : result?.success === false ? '#f8d7da' : '#f8f9fa'
    }}>
      <h3>{title}</h3>
      <button 
        onClick={() => {
          if (title.includes('Backend')) testBackend();
          else if (title.includes('Database')) testDatabase();
          else if (title.includes('Suppliers')) testSuppliers();
          else if (title.includes('Articles')) testArticles();
          else if (title.includes('Clients')) testClients();
        }}
        disabled={isLoading}
        style={{
          padding: '10px 15px',
          margin: '5px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {isLoading ? '🔄 Chargement...' : 'Tester'}
      </button>
      
      {result && (
        <div style={{ marginTop: '10px' }}>
          {result.success ? (
            <div>
              <strong>✅ Succès</strong>
              {result.data && (
                <div>
                  <p>Données trouvées: {Array.isArray(result.data) ? result.data.length : 'Oui'}</p>
                  <pre style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '10px', 
                    borderRadius: '3px',
                    overflow: 'auto',
                    maxHeight: '200px',
                    fontSize: '12px'
                  }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div>
              <strong>❌ Erreur: {result.error}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>🏠 Test Mode Local (Next.js Dev Server)</h1>
      
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#d1ecf1', 
        borderRadius: '5px', 
        marginBottom: '20px' 
      }}>
        <h3>📊 Configuration Locale</h3>
        <p><strong>Frontend:</strong> http://localhost:3002 (Next.js Dev)</p>
        <p><strong>Backend:</strong> http://localhost:3005</p>
        <p><strong>Mode:</strong> 100% Local (pas d'Internet requis)</p>
        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
      </div>

      <ResultDisplay 
        title="🔧 Test Backend Health" 
        result={results.backend} 
        isLoading={loading === 'backend'} 
      />
      
      <ResultDisplay 
        title="📊 Test Database Status" 
        result={results.database} 
        isLoading={loading === 'database'} 
      />
      
      <ResultDisplay 
        title="🏭 Test Suppliers" 
        result={results.suppliers} 
        isLoading={loading === 'suppliers'} 
      />
      
      <ResultDisplay 
        title="📦 Test Articles" 
        result={results.articles} 
        isLoading={loading === 'articles'} 
      />
      
      <ResultDisplay 
        title="👥 Test Clients" 
        result={results.clients} 
        isLoading={loading === 'clients'} 
      />

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
        <h3>🎯 Instructions</h3>
        <p>Cette page teste l'application en mode local via le serveur de développement Next.js.</p>
        <p>Toutes les requêtes passent par les routes API Next.js qui redirigent vers le backend local.</p>
        <p><strong>Avantage:</strong> Pas de problèmes CORS, fonctionne exactement comme en production !</p>
      </div>
    </div>
  );
}