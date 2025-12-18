'use client';

import { useState } from 'react';

export default function TestJSON() {
  const [results, setResults] = useState<string[]>([]);

  const testAPI = async (endpoint: string) => {
    try {
      const response = await fetch(`http://localhost:3005${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': '2025_bu01'
        }
      });

      const text = await response.text();
      
      // Analyser le texte brut
      const analysis = {
        status: response.status,
        length: text.length,
        first50: text.substring(0, 50),
        last50: text.substring(text.length - 50),
        charCodes: text.substring(0, 10).split('').map(c => c.charCodeAt(0))
      };

      // Tester le parsing JSON
      try {
        const json = JSON.parse(text);
        setResults(prev => [...prev, `✅ ${endpoint}: Valid JSON (${analysis.length} chars)`]);
      } catch (parseError) {
        setResults(prev => [...prev, `❌ ${endpoint}: ${parseError instanceof Error ? parseError.message : 'Erreur inconnue'}`]);
        setResults(prev => [...prev, `   Raw: "${analysis.first50}"`]);
        setResults(prev => [...prev, `   Codes: [${analysis.charCodes.join(', ')}]`]);
      }

    } catch (error) {
      setResults(prev => [...prev, `💥 ${endpoint}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`]);
    }
  };

  const runTests = () => {
    setResults([]);
    testAPI('/api/sales/clients');
    testAPI('/api/sales/suppliers');
    testAPI('/api/settings/families');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Test JSON API</h1>
      <button onClick={runTests} style={{ padding: '10px 20px', marginBottom: '20px' }}>
        Run Tests
      </button>
      
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '5px' }}>
        {results.map((result, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            {result}
          </div>
        ))}
      </div>
    </div>
  );
}