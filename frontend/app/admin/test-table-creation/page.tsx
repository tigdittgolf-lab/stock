'use client';

import { useState } from 'react';

export default function TestTableCreationPage() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testTableCreation = async () => {
    setIsLoading(true);
    setResult('🔄 Test en cours...\n');

    try {
      const response = await fetch('/api/admin/test-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          schemaName: '2009_bu02',
          tableName: 'test_article',
          columns: [
            { name: 'narticle', type: 'VARCHAR(50)', notNull: true },
            { name: 'designation', type: 'VARCHAR(255)', notNull: false },
            { name: 'prix_unitaire', type: 'DECIMAL', notNull: false }
          ]
        })
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
      <h1>🧪 Test Création Table Supabase</h1>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={testTableCreation}
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
          {isLoading ? '⏳ Test en cours...' : '🚀 Créer Table test_article'}
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
          <li>Vérifie que le schéma "2009_bu02" existe</li>
          <li>Essaie de créer la table "test_article" avec 3 colonnes</li>
          <li>Vérifie que la table existe vraiment</li>
          <li>Affiche le résultat détaillé</li>
        </ol>
        
        <h3 style={{ marginTop: '15px' }}>📝 SQL qui sera exécuté:</h3>
        <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '3px', overflow: 'auto' }}>
{`CREATE TABLE IF NOT EXISTS "2009_bu02"."test_article" (
  "narticle" VARCHAR(50) NOT NULL,
  "designation" VARCHAR(255),
  "prix_unitaire" DECIMAL
)`}
        </pre>
      </div>
    </div>
  );
}
