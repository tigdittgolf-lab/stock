'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from "../page.module.css";

interface Family {
  famille: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [newFamily, setNewFamily] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get tenant from localStorage
  const getTenant = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedTenant') || '2025_bu01';
    }
    return '2025_bu01';
  };

  // Show message
  const showMessage = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setMessage(null);
    } else {
      setMessage(msg);
      setError(null);
    }
    setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 3000);
  };

  // Fetch families
  const fetchFamilies = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3005/api/settings/families', {
        headers: {
          'X-Tenant': getTenant()
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setFamilies(result.data || []);
      } else {
        showMessage('Erreur lors du chargement des familles', true);
      }
    } catch (error) {
      console.error('Error fetching families:', error);
      showMessage('Erreur de connexion', true);
    } finally {
      setLoading(false);
    }
  };

  // Create family
  const createFamily = async () => {
    if (!newFamily.trim()) {
      showMessage('Veuillez saisir un nom de famille', true);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:3005/api/settings/families', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': getTenant()
        },
        body: JSON.stringify({ famille: newFamily.trim() })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setNewFamily('');
        fetchFamilies();
        showMessage('Famille créée avec succès !');
      } else {
        showMessage(result.error || 'Erreur lors de la création', true);
      }
    } catch (error) {
      console.error('Error creating family:', error);
      showMessage('Erreur lors de la création', true);
    } finally {
      setLoading(false);
    }
  };

  // Delete family
  const deleteFamily = async (famille: string) => {
    if (!confirm(`Supprimer la famille "${famille}" ?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3005/api/settings/families/${encodeURIComponent(famille)}`, {
        method: 'DELETE',
        headers: {
          'X-Tenant': getTenant()
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        fetchFamilies();
        showMessage('Famille supprimée avec succès !');
      } else {
        showMessage(result.error || 'Erreur lors de la suppression', true);
      }
    } catch (error) {
      console.error('Error deleting family:', error);
      showMessage('Erreur lors de la suppression', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>⚙️ Paramètres - Familles d'Articles</h1>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Gérez les familles d'articles pour organiser votre stock
            </div>
          </div>
          <button 
            onClick={() => router.back()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Retour
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Messages */}
        {message && (
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '15px',
            borderRadius: '5px',
            margin: '0 0 20px 0',
            border: '1px solid #c3e6cb'
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '5px',
            margin: '0 0 20px 0',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {/* Add Family Section */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#212529' }}>Ajouter une Famille</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={newFamily}
              onChange={(e) => setNewFamily(e.target.value)}
              placeholder="Nom de la famille (ex: Electricité, Plomberie...)"
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              onKeyPress={(e) => e.key === 'Enter' && createFamily()}
              disabled={loading}
            />
            <button
              onClick={createFamily}
              disabled={loading || !newFamily.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {loading ? 'Ajout...' : '➕ Ajouter'}
            </button>
          </div>
        </div>

        {/* Families List */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#212529' }}>
            Familles Existantes ({families.length})
          </h2>

          {loading && families.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
              Chargement des familles...
            </div>
          ) : families.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#6c757d',
              background: '#f8f9fa',
              borderRadius: '4px',
              border: '2px dashed #dee2e6'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📂</div>
              <p style={{ margin: '0', fontSize: '16px' }}>Aucune famille créée</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Commencez par ajouter votre première famille</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {families.map((family, index) => (
                <div
                  key={family.famille}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    background: '#f8f9fa'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      background: '#007bff', 
                      color: 'white', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      marginRight: '10px',
                      fontWeight: 'bold'
                    }}>
                      #{index + 1}
                    </span>
                    <span style={{ fontWeight: '500', fontSize: '16px' }}>
                      {family.famille}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteFamily(family.famille)}
                    disabled={loading}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{
          background: '#e7f3ff',
          border: '1px solid #b8daff',
          padding: '15px',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#004085' }}>💡 Instructions</h3>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#004085' }}>
            <li>Créez les familles d'articles pour organiser votre stock</li>
            <li>Une fois les familles créées, vous pourrez créer des articles sans erreur</li>
            <li>Exemples de familles : Electricité, Plomberie, Outillage, Peinture</li>
          </ul>
        </div>
      </main>
    </div>
  );
}