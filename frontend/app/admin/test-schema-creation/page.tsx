'use client';

import { useState } from 'react';

export default function TestSchemaCreationPage() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testSchemaCreation = async () => {
    setIsLoading(true);
    setResult('🔄 Test en cours...\n');

    try {
      const response = await fetch('/api/admin/test-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemaName: '2009_bu02' })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(prev => prev + '\n✅ SUCCÈS!\n' + JSON.stringify(data, null, 2));
      } else {
        setResult(prev => prev + '\n❌ ÉCHEC!\n' + JSON.stringify(data, null, 2));
      }
    } catch (error) {
      setResult(prev => prev + '\n❌ ERREUR: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Test Création Schéma Supabase</h1>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={testSchemaCreation}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isLoading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '⏳ Test en cours...' : '🚀 Créer Schéma 2009_bu02'}
        </button>
      </div>

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '5px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          maxHeight: '500px',
          overflow: 'auto'
        }}>
          {result}
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
        <h3>📋 Ce que ce test fait:</h3>
        <ol>
          <li>Se connecte à Supabase</li>
          <li>Essaie de créer le schéma "2009_bu02"</li>
          <li>Vérifie que le schéma existe vraiment</li>
          <li>Affiche le résultat détaillé</li>
        </ol>
      </div>
    </div>
  );
}
