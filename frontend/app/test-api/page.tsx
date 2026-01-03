'use client';

import { useState } from 'react';
import { getApiUrl } from '@/lib/api';

export default function TestApiPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testApiCall = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = getApiUrl('sales/suppliers');
      console.log('🔍 Testing API URL:', apiUrl);
      console.log('🌍 Environment info:', {
        hostname: window.location.hostname,
        origin: window.location.origin,
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        isDevelopment: process.env.NODE_ENV === 'development',
        isProduction: process.env.NODE_ENV === 'production'
      });

      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': '2025_bu01'
        }
      });

      console.log('📡 Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Data:', data);
      
      setResult({
        apiUrl,
        status: response.status,
        data: data
      });

    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Test API Local</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Environment Info:</h2>
        <ul>
          <li><strong>Hostname:</strong> {typeof window !== 'undefined' ? window.location.hostname : 'SSR'}</li>
          <li><strong>Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</li>
          <li><strong>NODE_ENV:</strong> {process.env.NODE_ENV || 'undefined'}</li>
          <li><strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'undefined'}</li>
        </ul>
      </div>

      <button 
        onClick={testApiCall}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test API Call'}
      </button>

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px'
        }}>
          <h3>❌ Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '4px'
        }}>
          <h3>✅ Success!</h3>
          <p><strong>API URL:</strong> {result.apiUrl}</p>
          <p><strong>Status:</strong> {result.status}</p>
          <p><strong>Suppliers count:</strong> {result.data?.data?.length || 0}</p>
          <details>
            <summary>Raw Response</summary>
            <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}