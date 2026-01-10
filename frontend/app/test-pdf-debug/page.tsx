'use client';

import { useState } from 'react';

export default function TestPDFDebug() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testPDFGeneration = async (blId: number, type: string) => {
    setLoading(true);
    setResult('');
    
    try {
      console.log(`🔍 Testing PDF generation for BL ${blId}, type: ${type}`);
      
      const url = `/api/pdf/delivery-note${type === 'complete' ? '' : `-${type}`}/${blId}`;
      console.log(`📄 Testing URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Tenant': '2025_bu01'
        }
      });
      
      console.log(`📊 Response status: ${response.status}`);
      console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/pdf')) {
          setResult(`✅ SUCCESS: PDF generated successfully for BL ${blId} (${type})\nContent-Type: ${contentType}\nSize: ${response.headers.get('content-length') || 'unknown'} bytes`);
        } else {
          const text = await response.text();
          setResult(`⚠️ WARNING: Response is not PDF\nContent-Type: ${contentType}\nResponse: ${text}`);
        }
      } else {
        const errorText = await response.text();
        setResult(`❌ ERROR: ${response.status} ${response.statusText}\nResponse: ${errorText}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      setResult(`❌ EXCEPTION: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testBackendDirect = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log(`🔍 Testing direct backend connection`);
      
      const url = 'https://frontend-iota-six-72.vercel.app/api/pdf/delivery-note/4';
      console.log(`📄 Testing direct backend URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Tenant': '2025_bu01'
        }
      });
      
      console.log(`📊 Backend response status: ${response.status}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        setResult(`✅ BACKEND SUCCESS: Direct backend works!\nContent-Type: ${contentType}\nStatus: ${response.status}`);
      } else {
        const errorText = await response.text();
        setResult(`❌ BACKEND ERROR: ${response.status}\nResponse: ${errorText}`);
      }
    } catch (error) {
      console.error('Backend test error:', error);
      setResult(`❌ BACKEND EXCEPTION: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔧 PDF Generation Debug Tool</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Test PDF Generation</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <button
            onClick={() => testPDFGeneration(4, 'complete')}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Test BL 4 Complete
          </button>
          
          <button
            onClick={() => testPDFGeneration(4, 'small')}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Test BL 4 Small
          </button>
          
          <button
            onClick={() => testPDFGeneration(4, 'ticket')}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Test BL 4 Ticket
          </button>
          
          <button
            onClick={() => testPDFGeneration(5, 'complete')}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Test BL 5 Complete
          </button>
        </div>
        
        <button
          onClick={testBackendDirect}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#fd7e14',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Direct Backend
        </button>
      </div>

      {loading && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <p>🔄 Testing in progress...</p>
        </div>
      )}

      {result && (
        <div style={{
          padding: '20px',
          backgroundColor: result.includes('SUCCESS') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${result.includes('SUCCESS') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h3>Test Result:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>{result}</pre>
        </div>
      )}

      <div style={{
        padding: '20px',
        backgroundColor: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '5px'
      }}>
        <h3>Debug Information:</h3>
        <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
        <p><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
        <p><strong>Tenant:</strong> 2025_bu01</p>
        <p><strong>Backend URL:</strong> https://frontend-iota-six-72.vercel.app</p>
      </div>
    </div>
  );
}