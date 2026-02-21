'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UserPermissionsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [schemas, setSchemas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadSchemas();
  }, []);

  const loadUsers = async () => {
    // TODO: Charger les utilisateurs depuis Supabase
    console.log('Loading users...');
  };

  const loadSchemas = async () => {
    try {
      const response = await fetch('/api/admin/discover-supabase-schemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://szgodrjglbpzkrksnroi.supabase.co',
          key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU'
        })
      });

      const data = await response.json();
      
      if (data.success && data.databases) {
        const allSchemas = [...data.databases.tenant, ...data.databases.other].map((db: any) => db.name);
        setSchemas(allSchemas);
      }
    } catch (error) {
      console.error('Error loading schemas:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>👥 Gestion des Permissions Utilisateurs</h1>
        <button 
          onClick={() => router.push('/admin')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Retour
        </button>
      </div>

      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2>📊 Schémas Disponibles ({schemas.length})</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
          {schemas.map(schema => (
            <div key={schema} style={{
              padding: '8px 16px',
              background: '#e7f3ff',
              border: '1px solid #007bff',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              {schema}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: '#fff3cd',
        border: '1px solid #ffc107',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>💡 Solution Temporaire</h3>
        <p style={{ margin: '0 0 10px 0' }}>
          Pour donner accès à un nouveau schéma migré, tu dois mettre à jour manuellement la table <code>users</code> dans Supabase:
        </p>
        <ol style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>Va sur Supabase SQL Editor</li>
          <li>Exécute cette requête pour ajouter le schéma à un utilisateur:</li>
        </ol>
        <pre style={{
          background: '#f8f9fa',
          padding: '15px',
          borderRadius: '6px',
          overflow: 'auto',
          fontSize: '13px',
          fontFamily: 'monospace'
        }}>
{`UPDATE public.users 
SET business_units = business_units || '["2009_bu02"]'::jsonb
WHERE email = 'ton-email@example.com';`}
        </pre>
        <p style={{ margin: '15px 0 0 0', fontSize: '14px', color: '#856404' }}>
          <strong>Note:</strong> Remplace <code>2009_bu02</code> par le nom du schéma migré et <code>ton-email@example.com</code> par l'email de l'utilisateur.
        </p>
      </div>
    </div>
  );
}
