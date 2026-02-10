'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface MigrationInfo {
  version: string;
  description: string;
  applied: boolean;
}

interface DatabaseStatus {
  total: number;
  applied: number;
  pending: number;
  migrations: MigrationInfo[];
}

export default function MigrationsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Record<string, DatabaseStatus>>({});
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // États pour la création de migration
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMigration, setNewMigration] = useState({
    description: '',
    sql: '',
    table: 'bl'
  });

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/migrations');
      const data = await response.json();

      if (data.success) {
        setStatus(data.data);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const applyMigrations = async (dryRun: boolean = false) => {
    if (!dryRun && !confirm('Êtes-vous sûr de vouloir appliquer les migrations?')) {
      return;
    }

    try {
      setApplying(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/admin/migrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database: selectedDatabase === 'all' ? undefined : selectedDatabase,
          dryRun
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(data.message);
        await loadStatus(); // Recharger le statut
      } else {
        setError(data.error || 'Erreur lors de l\'application');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion');
    } finally {
      setApplying(false);
    }
  };

  const createMigration = async () => {
    if (!newMigration.description || !newMigration.sql) {
      setError('Description et SQL sont requis');
      return;
    }

    try {
      setApplying(true);
      setError(null);

      const response = await fetch('/api/admin/migrations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMigration)
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Migration créée avec succès!');
        setShowCreateForm(false);
        setNewMigration({ description: '', sql: '', table: 'bl' });
        await loadStatus();
      } else {
        setError(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion');
    } finally {
      setApplying(false);
    }
  };

  const generateSQL = (type: string) => {
    const templates: Record<string, string> = {
      'add_column': `ALTER TABLE ${newMigration.table} 
ADD COLUMN IF NOT EXISTS nom_colonne VARCHAR(50) NULL 
COMMENT 'Description de la colonne';`,
      'add_index': `CREATE INDEX IF NOT EXISTS idx_${newMigration.table}_colonne 
ON ${newMigration.table}(nom_colonne);`,
      'modify_column': `ALTER TABLE ${newMigration.table} 
MODIFY COLUMN nom_colonne VARCHAR(100);`,
      'add_foreign_key': `ALTER TABLE ${newMigration.table} 
ADD CONSTRAINT fk_${newMigration.table}_autre 
FOREIGN KEY (autre_id) REFERENCES autre_table(id);`
    };
    
    setNewMigration({ ...newMigration, sql: templates[type] || '' });
  };

  const databases = Object.keys(status);
  const totalPending = Object.values(status).reduce((sum, db) => sum + (db.pending || 0), 0);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '2px solid #eee'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>🔄 Gestion des Migrations</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Synchronisation des structures de bases de données
          </p>
        </div>
        <button
          onClick={() => router.push('/admin')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          ← Retour Admin
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          ❌ {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          ✅ {successMessage}
        </div>
      )}

      {/* Résumé global */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '30px',
        color: 'white'
      }}>
        <h2 style={{ margin: '0 0 15px 0' }}>📊 Résumé Global</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{databases.length}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Bases de données</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{totalPending}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Migrations en attente</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>⚙️ Actions</h3>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {showCreateForm ? '❌ Annuler' : '➕ Créer une migration'}
          </button>
        </div>

        {showCreateForm && (
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 15px 0' }}>📝 Nouvelle Migration</h4>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Description:
              </label>
              <input
                type="text"
                placeholder="Ex: Ajouter colonne remise dans bl"
                value={newMigration.description}
                onChange={(e) => setNewMigration({ ...newMigration, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Table concernée:
              </label>
              <select
                value={newMigration.table}
                onChange={(e) => setNewMigration({ ...newMigration, table: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="bl">bl (Bons de livraison)</option>
                <option value="fact">fact (Factures)</option>
                <option value="client">client (Clients)</option>
                <option value="article">article (Articles)</option>
                <option value="fournisseur">fournisseur (Fournisseurs)</option>
                <option value="bl_achat">bl_achat (BL Achat)</option>
                <option value="detail_bl">detail_bl (Détails BL)</option>
                <option value="detail_fact">detail_fact (Détails Factures)</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Templates SQL:
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => generateSQL('add_column')} style={{ padding: '8px 12px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                  ➕ Ajouter colonne
                </button>
                <button onClick={() => generateSQL('add_index')} style={{ padding: '8px 12px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                  🔍 Ajouter index
                </button>
                <button onClick={() => generateSQL('modify_column')} style={{ padding: '8px 12px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                  ✏️ Modifier colonne
                </button>
                <button onClick={() => generateSQL('add_foreign_key')} style={{ padding: '8px 12px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                  🔗 Clé étrangère
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Code SQL:
              </label>
              <textarea
                placeholder="ALTER TABLE bl ADD COLUMN ..."
                value={newMigration.sql}
                onChange={(e) => setNewMigration({ ...newMigration, sql: e.target.value })}
                rows={8}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
            </div>

            <button
              onClick={createMigration}
              disabled={applying || !newMigration.description || !newMigration.sql}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (applying || !newMigration.description || !newMigration.sql) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                opacity: (applying || !newMigration.description || !newMigration.sql) ? 0.6 : 1
              }}
            >
              💾 Créer la migration
            </button>
          </div>
        )}
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            Base de données cible:
          </label>
          <select
            value={selectedDatabase}
            onChange={(e) => setSelectedDatabase(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="all">Toutes les bases de données</option>
            {databases.map(db => (
              <option key={db} value={db}>{db}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => loadStatus()}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: loading ? 0.6 : 1
            }}
          >
            🔄 Actualiser
          </button>

          <button
            onClick={() => applyMigrations(true)}
            disabled={applying || totalPending === 0}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ffc107',
              color: '#212529',
              border: 'none',
              borderRadius: '8px',
              cursor: (applying || totalPending === 0) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: (applying || totalPending === 0) ? 0.6 : 1
            }}
          >
            🧪 Simuler
          </button>

          <button
            onClick={() => applyMigrations(false)}
            disabled={applying || totalPending === 0}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (applying || totalPending === 0) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: (applying || totalPending === 0) ? 0.6 : 1
            }}
          >
            ✅ Appliquer les migrations
          </button>
        </div>
      </div>

      {/* Liste des bases de données */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p>Chargement...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {databases.map(database => {
            const dbStatus = status[database];
            return (
              <div
                key={database}
                style={{
                  background: 'white',
                  borderRadius: '10px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: dbStatus.pending > 0 ? '2px solid #ffc107' : '1px solid #e0e0e0'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <h3 style={{ margin: 0 }}>📁 {database}</h3>
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    fontSize: '14px'
                  }}>
                    <span style={{
                      background: '#d4edda',
                      color: '#155724',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontWeight: 'bold'
                    }}>
                      ✅ {dbStatus.applied} appliquées
                    </span>
                    {dbStatus.pending > 0 && (
                      <span style={{
                        background: '#fff3cd',
                        color: '#856404',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontWeight: 'bold'
                      }}>
                        ⏳ {dbStatus.pending} en attente
                      </span>
                    )}
                  </div>
                </div>

                {dbStatus.pending > 0 && (
                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '6px',
                    padding: '15px'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                      Migrations en attente:
                    </h4>
                    {dbStatus.migrations
                      .filter(m => !m.applied)
                      .map(migration => (
                        <div
                          key={migration.version}
                          style={{
                            padding: '8px',
                            marginBottom: '5px',
                            background: 'white',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        >
                          <strong>{migration.version}:</strong> {migration.description}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
