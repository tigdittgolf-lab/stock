'use client';

import { useState } from 'react';

export default function TestCleanupPage() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const deleteSchema = async () => {
    if (!confirm('⚠️ ATTENTION: Voulez-vous vraiment supprimer le schéma 2009_bu02 et TOUTES ses tables?')) {
      return;
    }

    setIsLoading(true);
    setResult('🔄 Suppression en cours...\n');

    try {
      const response = await fetch('/api/admin/test-cleanup', {
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
      <h1>🗑️ Nettoyage Schéma Supabase</h1>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#ffebee', borderRadius: '5px', border: '2px solid #f44336' }}>
        <h3 style={{ color: '#d32f2f', marginTop: 0 }}>⚠️ ATTENTION - ACTION DESTRUCTIVE</h3>
        <p>Cette action va supprimer:</p>
        <ul>
          <li>Le schéma <strong>2009_bu02</strong></li>
          <li>TOUTES les tables dans ce schéma</li>
          <li>TOUTES les données dans ces tables</li>
        </ul>
        <p style={{ fontWeight: 'bold', color: '#d32f2f' }}>Cette action est IRRÉVERSIBLE!</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={deleteSchema}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isLoading ? '#ccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '⏳ Suppression en cours...' : '🗑️ Supprimer Schéma 2009_bu02'}
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

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
        <h3>📋 Ce que cette action fait:</h3>
        <ol>
          <li>Se connecte à Supabase</li>
          <li>Vérifie que le schéma "2009_bu02" existe</li>
          <li>Supprime le schéma avec CASCADE (toutes les tables)</li>
          <li>Vérifie que le schéma a bien été supprimé</li>
        </ol>
        
        <h3 style={{ marginTop: '15px' }}>🎯 Après suppression:</h3>
        <p>Vous pourrez tester la migration complète de A à Z:</p>
        <ol>
          <li>Aller sur /admin/database-migration</li>
          <li>Sélectionner 2009_bu02</li>
          <li>Lancer la migration</li>
          <li>Vérifier que le schéma ET les 33 tables sont créés</li>
        </ol>
      </div>
    </div>
  );
}
