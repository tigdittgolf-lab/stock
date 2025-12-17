'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from "../../page.module.css";

interface BusinessUnit {
  schema_name: string;
  bu_code: string;
  year: number;
  nom_entreprise: string;
  adresse: string;
  telephone: string;
  email: string;
  nif: string;
  rc: string;
  activite: string;
  slogan: string;
  active: boolean;
  created_at: string;
}

export default function BusinessUnitsPage() {
  const router = useRouter();
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBU, setEditingBU] = useState<BusinessUnit | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    bu_code: '',
    year: new Date().getFullYear(),
    nom_entreprise: '',
    adresse: '',
    telephone: '',
    email: '',
    nif: '',
    rc: '',
    activite: '',
    slogan: ''
  });

  useEffect(() => {
    fetchBusinessUnits();
  }, []);

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

  const fetchBusinessUnits = async () => {
    try {
      setLoading(true);
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showMessage('Token d\'authentification manquant', true);
        return;
      }
      
      const response = await fetch('http://localhost:3005/api/admin/business-units', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setBusinessUnits(result.data || []);
      } else {
        showMessage('Erreur lors du chargement des BU', true);
      }
    } catch (error) {
      console.error('Error fetching business units:', error);
      showMessage('Erreur de connexion', true);
    } finally {
      setLoading(false);
    }
  };

  const createBusinessUnit = async () => {
    if (!formData.bu_code || !formData.nom_entreprise) {
      showMessage('Code BU et nom entreprise requis', true);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3005/api/admin/business-units', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        showMessage('Business Unit créée avec succès !');
        setShowCreateForm(false);
        setFormData({
          bu_code: '',
          year: new Date().getFullYear(),
          nom_entreprise: '',
          adresse: '',
          telephone: '',
          email: '',
          nif: '',
          rc: '',
          activite: '',
          slogan: ''
        });
        fetchBusinessUnits();
      } else {
        showMessage(result.error || 'Erreur lors de la création', true);
      }
    } catch (error) {
      console.error('Error creating business unit:', error);
      showMessage('Erreur lors de la création', true);
    } finally {
      setLoading(false);
    }
  };

  const updateBusinessUnit = async () => {
    if (!editingBU) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3005/api/admin/business-units/${editingBU.schema_name}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingBU)
      });
      
      const result = await response.json();
      
      if (result.success) {
        showMessage('Business Unit mise à jour avec succès !');
        setEditingBU(null);
        fetchBusinessUnits();
      } else {
        showMessage(result.error || 'Erreur lors de la mise à jour', true);
      }
    } catch (error) {
      console.error('Error updating business unit:', error);
      showMessage('Erreur lors de la mise à jour', true);
    } finally {
      setLoading(false);
    }
  };

  const deleteBusinessUnit = async (schema: string) => {
    if (!confirm(`⚠️ ATTENTION: Supprimer la BU "${schema}" supprimera TOUTES ses données (articles, clients, factures, etc.). Cette action est IRRÉVERSIBLE. Continuer ?`)) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3005/api/admin/business-units/${schema}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        showMessage('Business Unit supprimée avec succès !');
        fetchBusinessUnits();
      } else {
        showMessage(result.error || 'Erreur lors de la suppression', true);
      }
    } catch (error) {
      console.error('Error deleting business unit:', error);
      showMessage('Erreur lors de la suppression', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>🏢 Gestion des Business Units</h1>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Créer et gérer les unités commerciales
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showCreateForm ? '❌ Annuler' : '➕ Nouvelle BU'}
            </button>
            <button 
              onClick={() => router.push('/admin')}
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
        </div>
      </header>

      <main className={styles.main} style={{ paddingTop: '40px' }}>
        {/* Messages */}
        {message && (
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
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
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {/* Formulaire de création */}
        {showCreateForm && (
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#212529' }}>➕ Créer une nouvelle Business Unit</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Code BU * (ex: bu01, bu02)
                </label>
                <input
                  type="text"
                  value={formData.bu_code}
                  onChange={(e) => setFormData({...formData, bu_code: e.target.value})}
                  placeholder="bu01"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Année *
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  value={formData.nom_entreprise}
                  onChange={(e) => setFormData({...formData, nom_entreprise: e.target.value})}
                  placeholder="Nom de l'entreprise"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                  placeholder="Adresse complète"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Téléphone
                </label>
                <input
                  type="text"
                  value={formData.telephone}
                  onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                  placeholder="Numéro de téléphone"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@example.com"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  NIF
                </label>
                <input
                  type="text"
                  value={formData.nif}
                  onChange={(e) => setFormData({...formData, nif: e.target.value})}
                  placeholder="Numéro d'identification fiscale"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  RC
                </label>
                <input
                  type="text"
                  value={formData.rc}
                  onChange={(e) => setFormData({...formData, rc: e.target.value})}
                  placeholder="Registre de commerce"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Activité
                </label>
                <textarea
                  value={formData.activite}
                  onChange={(e) => setFormData({...formData, activite: e.target.value})}
                  placeholder="Description de l'activité"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Slogan
                </label>
                <input
                  type="text"
                  value={formData.slogan}
                  onChange={(e) => setFormData({...formData, slogan: e.target.value})}
                  placeholder="Slogan de l'entreprise"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                <button
                  onClick={createBusinessUnit}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: loading ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  {loading ? 'Création...' : '✅ Créer la Business Unit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des BU */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#212529' }}>
            📋 Business Units Existantes ({businessUnits.length})
          </h2>

          {loading && businessUnits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
              Chargement des Business Units...
            </div>
          ) : businessUnits.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#6c757d',
              background: '#f8f9fa',
              borderRadius: '4px',
              border: '2px dashed #dee2e6'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🏢</div>
              <p style={{ margin: '0', fontSize: '16px' }}>Aucune Business Unit créée</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Commencez par créer votre première BU</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {businessUnits.map((bu) => (
                <div
                  key={bu.schema_name}
                  style={{
                    padding: '20px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    background: '#f8f9fa'
                  }}
                >
                  {editingBU?.schema_name === bu.schema_name ? (
                    // Mode édition
                    <div>
                      <h3 style={{ margin: '0 0 15px 0', color: '#667eea' }}>
                        ✏️ Modification: {bu.schema_name}
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                            Nom entreprise
                          </label>
                          <input
                            type="text"
                            value={editingBU.nom_entreprise}
                            onChange={(e) => setEditingBU({...editingBU, nom_entreprise: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                            Téléphone
                          </label>
                          <input
                            type="text"
                            value={editingBU.telephone}
                            onChange={(e) => setEditingBU({...editingBU, telephone: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                            Email
                          </label>
                          <input
                            type="email"
                            value={editingBU.email}
                            onChange={(e) => setEditingBU({...editingBU, email: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                            NIF
                          </label>
                          <input
                            type="text"
                            value={editingBU.nif}
                            onChange={(e) => setEditingBU({...editingBU, nif: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                            RC
                          </label>
                          <input
                            type="text"
                            value={editingBU.rc}
                            onChange={(e) => setEditingBU({...editingBU, rc: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                            Adresse
                          </label>
                          <input
                            type="text"
                            value={editingBU.adresse}
                            onChange={(e) => setEditingBU({...editingBU, adresse: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                            Activité
                          </label>
                          <textarea
                            value={editingBU.activite}
                            onChange={(e) => setEditingBU({...editingBU, activite: e.target.value})}
                            rows={2}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              fontSize: '14px',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                            Slogan
                          </label>
                          <input
                            type="text"
                            value={editingBU.slogan}
                            onChange={(e) => setEditingBU({...editingBU, slogan: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button
                          onClick={updateBusinessUnit}
                          disabled={loading}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ✅ Enregistrer
                        </button>
                        <button
                          onClick={() => setEditingBU(null)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ❌ Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Mode affichage
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 5px 0', color: '#667eea', fontSize: '20px' }}>
                            🏢 {bu.nom_entreprise}
                          </h3>
                          <div style={{ fontSize: '14px', color: '#6c757d' }}>
                            Schéma: <strong>{bu.schema_name}</strong> | Année: <strong>{bu.year}</strong>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => setEditingBU(bu)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={() => deleteBusinessUnit(bu.schema_name)}
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
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px' }}>
                        {bu.adresse && (
                          <div>
                            <strong>📍 Adresse:</strong><br />
                            {bu.adresse}
                          </div>
                        )}
                        {bu.telephone && (
                          <div>
                            <strong>📞 Téléphone:</strong><br />
                            {bu.telephone}
                          </div>
                        )}
                        {bu.email && (
                          <div>
                            <strong>📧 Email:</strong><br />
                            {bu.email}
                          </div>
                        )}
                        {bu.nif && (
                          <div>
                            <strong>🆔 NIF:</strong><br />
                            {bu.nif}
                          </div>
                        )}
                        {bu.rc && (
                          <div>
                            <strong>📋 RC:</strong><br />
                            {bu.rc}
                          </div>
                        )}
                        {bu.activite && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <strong>🎯 Activité:</strong><br />
                            {bu.activite}
                          </div>
                        )}
                        {bu.slogan && (
                          <div style={{ gridColumn: '1 / -1', fontStyle: 'italic', color: '#6c757d' }}>
                            "{bu.slogan}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
