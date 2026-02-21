'use client';

import { useState } from 'react';

export default function TestSchemasPage() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const discoverAllSchemas = async () => {
    setIsLoading(true);
    setResult('🔍 Découverte de TOUS les schémas...\n');

    try {
      const { createClient } = await import('@supabase/supabase-js');
      
      const client = createClient(
        'https://szgodrjglbpzkrksnroi.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU'
      );

      // Appeler la nouvelle fonction discover_all_schemas
      const { data, error } = await client.rpc('discover_all_schemas', {});

      if (error) {
        setResult(prev => prev + `\n❌ Erreur: ${error.message}\n`);
        setResult(prev => prev + '\n💡 La fonction discover_all_schemas n\'existe peut-être pas encore.\n');
        setResult(prev => prev + '💡 Exécute le fichier CREATE_DISCOVERY_RPC_FUNCTIONS.sql dans Supabase!\n');
        return;
      }

      const schemas = Array.isArray(data) ? data : JSON.parse(data || '[]');
      
      setResult(prev => prev + `\n✅ ${schemas.length} schémas trouvés:\n\n`);

      // Grouper par type
      const tenantSchemas = schemas.filter((s: any) => s.is_tenant);
      const systemSchemas = schemas.filter((s: any) => s.is_system);
      const otherSchemas = schemas.filter((s: any) => !s.is_tenant && !s.is_system);

      setResult(prev => prev + `📊 SCHÉMAS TENANT (${tenantSchemas.length}):\n`);
      tenantSchemas.forEach((s: any) => {
        setResult(prev => prev + `  ✅ ${s.schema_name}\n`);
      });

      setResult(prev => prev + `\n📁 AUTRES SCHÉMAS (${otherSchemas.length}):\n`);
      otherSchemas.forEach((s: any) => {
        setResult(prev => prev + `  📂 ${s.schema_name}\n`);
      });

      setResult(prev => prev + `\n⚙️ SCHÉMAS SYSTÈME (${systemSchemas.length}):\n`);
      systemSchemas.forEach((s: any) => {
        setResult(prev => prev + `  🔧 ${s.schema_name}\n`);
      });

    } catch (error) {
      setResult(prev => prev + `\n❌ ERREUR: ${error}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const discoverTenantSchemas = async () => {
    setIsLoading(true);
    setResult('🔍 Découverte des schémas TENANT uniquement...\n');

    try {
      const { createClient } = await import('@supabase/supabase-js');
      
      const client = createClient(
        'https://szgodrjglbpzkrksnroi.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU'
      );

      const { data, error } = await client.rpc('discover_tenant_schemas', {});

      if (error) {
        setResult(prev => prev + `\n❌ Erreur: ${error.message}\n`);
        return;
      }

      const schemas = Array.isArray(data) ? data : JSON.parse(data || '[]');
      
      setResult(prev => prev + `\n✅ ${schemas.length} schémas tenant trouvés:\n\n`);
      schemas.forEach((schema: string) => {
        setResult(prev => prev + `  📊 ${schema}\n`);
      });

    } catch (error) {
      setResult(prev => prev + `\n❌ ERREUR: ${error}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>🔍 Diagnostic des Schémas Supabase</h1>
      
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={discoverAllSchemas}
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '⏳ Chargement...' : '🔍 Découvrir TOUS les schémas'}
        </button>

        <button 
          onClick={discoverTenantSchemas}
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isLoading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '⏳ Chargement...' : '📊 Découvrir schémas TENANT'}
        </button>
      </div>

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '5px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          maxHeight: '600px',
          overflow: 'auto',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          {result}
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e7f3ff', borderRadius: '5px' }}>
        <h3>💡 Instructions:</h3>
        <ol>
          <li>Clique sur "Découvrir TOUS les schémas" pour voir tous les schémas dans Supabase</li>
          <li>Vérifie que ton schéma migré (ex: 2009_bu02) apparaît dans la liste</li>
          <li>Si la fonction n'existe pas, exécute <code>CREATE_DISCOVERY_RPC_FUNCTIONS.sql</code> dans Supabase</li>
          <li>Les schémas TENANT sont ceux qui contiennent "_bu" dans leur nom</li>
        </ol>
      </div>
    </div>
  );
}
