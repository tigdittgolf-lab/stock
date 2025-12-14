'use client';

import { useState } from 'react';

export default function SimpleTest() {
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testFetch = async () => {
    setResult('');
    setError('');
    
    try {
      console.log('🔍 Starting fetch...');
      
      const response = await fetch('http://localhost:3005/api/sales/clients', {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': '2025_bu01'
        }
      });
      
      console.log('📡 Response received:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      const text = await response.text();
      console.log('📄 Raw text:', text);
      console.log('📏 Text length:', text.length);
      console.log('🔤 First 20 chars:', JSON.stringify(text.substring(0, 20)));
      
      // Analyser caractère par caractère
      const charAnalysis = [];
      for (let i = 0; i < Math.min(10, text.length); i++) {
        charAnalysis.push({
          pos: i,
          char: text[i],
          code: text.charCodeAt(i),
          hex: '0x' + text.charCodeAt(i).toString(16)
        });
      }
      console.log('🔍 Character analysis:', charAnalysis);
      
      // Tenter le parsing JSON
      try {
        const json = JSON.parse(text);
        setResult(`✅ SUCCESS: ${JSON.stringify(json, null, 2)}`);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        setError(`JSON Parse Error: ${parseError.message}\n\nRaw response: ${JSON.stringify(text)}\n\nChar codes: ${charAnalysis.map(c => `[${c.pos}]${c.char}(${c.code})`).join(' ')}`);
      }
      
    } catch (fetchError) {
      console.error('💥 Fetch Error:', fetchError);
      setError(`Fetch Error: ${fetchError.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Simple API Test</h1>
      <button 
        onClick={testFetch}
        style={{ 
          padding: '10px 20px', 
          marginBottom: '20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test API Call
      </button>
      
      {result && (
        <div style={{ 
          background: '#d4edda', 
          padding: '15px', 
          borderRadius: '5px',
          marginBottom: '10px',
          whiteSpace: 'pre-wrap'
        }}>
          {result}
        </div>
      )}
      
      {error && (
        <div style={{ 
          background: '#f8d7da', 
          padding: '15px', 
          borderRadius: '5px',
          whiteSpace: 'pre-wrap',
          fontSize: '12px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
}