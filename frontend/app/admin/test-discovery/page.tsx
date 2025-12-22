'use client';

import { useState } from 'react';

export default function TestDiscoveryPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiscoveryTest = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const supabaseConfig = {
        type: 'supabase',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      };

      const response = await fetch('/api/admin/test-discovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ supabaseConfig })
      });

      const data = await response.json();
      
      if (data.success) {
        setResults(data);
      } else {
        setError(data.error || 'Erreur inconnue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Test de Découverte Supabase</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Objectif</h2>
        <p className="text-blue-700">
          Ce test va vérifier si les fonctions RPC de découverte fonctionnent correctement 
          et identifier quelles tables existent réellement dans votre base Supabase.
        </p>
      </div>

      <button
        onClick={runDiscoveryTest}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium mb-6"
      >
        {loading ? 'Test en cours...' : 'Lancer le Test de Découverte'}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {/* Résumé */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Résumé</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Schémas trouvés:</span>
                <span className="ml-2 text-green-700">{results.summary?.schemasFound || 0}</span>
              </div>
              <div>
                <span className="font-medium">Total tables:</span>
                <span className="ml-2 text-green-700">{results.summary?.totalTables || 0}</span>
              </div>
              <div>
                <span className="font-medium">Fonctions RPC:</span>
                <span className="ml-2 text-green-700">
                  {results.summary?.rpcFunctionsWorking ? '✅ OK' : '❌ Erreur'}
                </span>
              </div>
            </div>
          </div>

          {/* Schémas découverts */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Schémas Découverts</h3>
            <div className="flex flex-wrap gap-2">
              {results.results?.schemas?.map((schema: string) => (
                <span key={schema} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {schema}
                </span>
              ))}
            </div>
          </div>

          {/* Tables par schéma */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Tables par Schéma</h3>
            {Object.entries(results.results?.tables || {}).map(([schema, tables]: [string, any]) => (
              <div key={schema} className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">{schema} ({Array.isArray(tables) ? tables.length : 0} tables)</h4>
                <div className="grid grid-cols-4 gap-2">
                  {Array.isArray(tables) && tables.map((table: any) => (
                    <span key={table.table_name} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                      {table.table_name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Structures d'exemple */}
          {Object.keys(results.results?.sampleStructures || {}).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Structures d'Exemple</h3>
              {Object.entries(results.results?.sampleStructures || {}).map(([tableName, structure]: [string, any]) => (
                <div key={tableName} className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">{tableName}</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>Colonnes:</strong> {structure.columns?.length || 0}</p>
                    <p><strong>Enregistrements:</strong> {structure.record_count || 0}</p>
                    {structure.columns?.slice(0, 5).map((col: any) => (
                      <div key={col.column_name} className="text-xs text-gray-600">
                        • {col.column_name} ({col.data_type})
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Données brutes */}
          <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <summary className="font-medium cursor-pointer">Données Brutes (pour debug)</summary>
            <pre className="mt-3 text-xs overflow-auto bg-white p-3 rounded border">
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}