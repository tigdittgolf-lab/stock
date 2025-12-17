'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from "../../page.module.css";

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  business_units: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface BusinessUnit {
  schema_name: string;
  nom_entreprise: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'user',
    business_units: [] as string[]
  });

  useEffect(() => {
    fetchUsers();
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3005/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setUsers(result.data || []);
      } else {
        showMessage('Erreur lors du chargement des utilisateurs', true);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showMessage('Erreur de connexion', true);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessUnits = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3005/api/admin/business-units', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setBusinessUnits(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching business units:', error);
    }
  };

  const createUser = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      showMessage('Username, email et password requis', true);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3005/api/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        showMessage('Utilisateur créé avec succès !');
        setShowCreateForm(false);
        setFormData({
          username: '',
          email: '',
          password: '',
          full_name: '',
          role: 'user',
          business_units: []
        });
        fetchUsers();
      } else {
        showMessage(result.error || 'Erreur lors de la création', true);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showMessage('Erreur lors de la création', true);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async () => {
    if (!editingUser) return;

    console.log('🔄 Updating user:', editingUser);

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3005/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingUser)
      });

      console.log('📡 Response status:', response.status);
      
      const result = await response.json();
      console.log('📋 Response data:', result);
      
      if (result.success) {
        showMessage('Utilisateur mis à jour avec succès !');
        setEditingUser(null);
        fetchUsers();
      } else {
        console.error('❌ Update failed:', result.error);
        showMessage(result.error || 'Erreur lors de la mise à jour', true);
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      showMessage('Erreur lors de la mise à jour', true);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: number, username: string) => {
    if (!confirm(`Supprimer l'utilisateur "${username}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3005/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        showMessage('Utilisateur supprimé avec succès !');
        fetchUsers();
      } else {
        showMessage(result.error || 'Erreur lors de la suppression', true);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showMessage('Erreur lors de la suppression', true);
    } finally {
      setLoading(false);
    }
  };

  const toggleBU = (buSchema: string, isEditing: boolean = false) => {
    if (isEditing && editingUser) {
      const currentBUs = editingUser.business_units || [];
      const newBUs = currentBUs.includes(buSchema)
        ? currentBUs.filter(bu => bu !== buSchema)
        : [...currentBUs, buSchema];
      setEditingUser({ ...editingUser, business_units: newBUs });
    } else {
      const currentBUs = formData.business_units || [];
      const newBUs = currentBUs.includes(buSchema)
        ? currentBUs.filter(bu => bu !== buSchema)
        : [...currentBUs, buSchema];
      setFormData({ ...formData, business_units: newBUs });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'manager': return '#ffc107';
      case 'user': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '👨‍💼 Admin';
      case 'manager': return '👔 Manager';
      case 'user': return '👤 Utilisateur';
      default: return role;
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>👥 Gestion des Utilisateurs</h1>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Créer et gérer les comptes utilisateurs
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
              {showCreateForm ? '❌ Annuler' : '➕ Nouvel Utilisateur'}
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
            <h2 style={{ margin: '0 0 20px 0', color: '#212529' }}>➕ Créer un nouvel utilisateur</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="nom.utilisateur"
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
                  Email *
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
                  Mot de passe *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
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
                  Nom complet
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  placeholder="Prénom Nom"
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
                  Rôle
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                >
                  <option value="user">👤 Utilisateur</option>
                  <option value="manager">👔 Manager</option>
                  <option value="admin">👨‍💼 Administrateur</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
                  Business Units autorisées
                </label>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '10px',
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}>
                  {businessUnits.length === 0 ? (
                    <div style={{ color: '#6c757d', fontSize: '14px' }}>
                      Aucune Business Unit disponible
                    </div>
                  ) : (
                    businessUnits.map((bu) => (
                      <label
                        key={bu.schema_name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: formData.business_units.includes(bu.schema_name) ? '#007bff' : 'white',
                          color: formData.business_units.includes(bu.schema_name) ? 'white' : '#212529',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.business_units.includes(bu.schema_name)}
                          onChange={() => toggleBU(bu.schema_name)}
                          style={{ marginRight: '8px' }}
                        />
                        <span>
                          <strong>{bu.schema_name}</strong>
                          <br />
                          <small style={{ opacity: 0.8 }}>{bu.nom_entreprise}</small>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                <button
                  onClick={createUser}
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
                  {loading ? 'Création...' : '✅ Créer l\'utilisateur'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des utilisateurs */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#212529' }}>
            📋 Utilisateurs Existants ({users.length})
          </h2>

          {loading && users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
              Chargement des utilisateurs...
            </div>
          ) : users.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#6c757d',
              background: '#f8f9fa',
              borderRadius: '4px',
              border: '2px dashed #dee2e6'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>👥</div>
              <p style={{ margin: '0', fontSize: '16px' }}>Aucun utilisateur créé</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Commencez par créer votre premier utilisateur</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {users.map((user) => (
                <div
                  key={user.id}
                  style={{
                    padding: '20px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    background: user.active ? '#f8f9fa' : '#fff3cd'
                  }}
                >
                  {editingUser?.id === user.id ? (
                    // Mode édition
                    <div>
                      <h3 style={{ margin: '0 0 15px 0', color: '#f5576c' }}>
                        ✏️ Modification: {user.username}
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                            Username
                          </label>
                          <input
                            type="text"
                            value={editingUser.username}
                            onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
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
                            value={editingUser.email}
                            onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
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
                            Nom complet
                          </label>
                          <input
                            type="text"
                            value={editingUser.full_name}
                            onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
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
                            Rôle
                          </label>
                          <select
                            value={editingUser.role}
                            onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                          >
                            <option value="user">👤 Utilisateur</option>
                            <option value="manager">👔 Manager</option>
                            <option value="admin">👨‍💼 Administrateur</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                            Statut
                          </label>
                          <select
                            value={editingUser.active ? 'true' : 'false'}
                            onChange={(e) => setEditingUser({...editingUser, active: e.target.value === 'true'})}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                          >
                            <option value="true">✅ Actif</option>
                            <option value="false">❌ Inactif</option>
                          </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500', fontSize: '14px' }}>
                            Business Units autorisées
                          </label>
                          <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '10px',
                            padding: '15px',
                            background: 'white',
                            borderRadius: '4px',
                            border: '1px solid #dee2e6'
                          }}>
                            {businessUnits.map((bu) => (
                              <label
                                key={bu.schema_name}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '8px 12px',
                                  background: editingUser.business_units?.includes(bu.schema_name) ? '#007bff' : '#f8f9fa',
                                  color: editingUser.business_units?.includes(bu.schema_name) ? 'white' : '#212529',
                                  border: '1px solid #dee2e6',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={editingUser.business_units?.includes(bu.schema_name)}
                                  onChange={() => toggleBU(bu.schema_name, true)}
                                  style={{ marginRight: '8px' }}
                                />
                                <span>
                                  <strong>{bu.schema_name}</strong>
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button
                          onClick={() => {
                            console.log('🖱️ Button clicked!');
                            console.log('📝 editingUser:', editingUser);
                            console.log('⏳ loading:', loading);
                            updateUser();
                          }}
                          disabled={loading}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: loading ? '#6c757d' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          {loading ? '⏳ Enregistrement...' : '✅ Enregistrer'}
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
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
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                            <h3 style={{ margin: 0, color: '#212529', fontSize: '18px' }}>
                              {user.full_name || user.username}
                            </h3>
                            <span style={{
                              padding: '4px 10px',
                              background: getRoleBadgeColor(user.role),
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              {getRoleLabel(user.role)}
                            </span>
                            {!user.active && (
                              <span style={{
                                padding: '4px 10px',
                                background: '#ffc107',
                                color: '#856404',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}>
                                ⚠️ Inactif
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6c757d' }}>
                            <strong>@{user.username}</strong> | {user.email}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => setEditingUser(user)}
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
                            onClick={() => deleteUser(user.id, user.username)}
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
                      
                      <div style={{ marginTop: '15px' }}>
                        <strong style={{ fontSize: '14px', color: '#495057' }}>
                          Business Units autorisées ({user.business_units?.length || 0}):
                        </strong>
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: '8px',
                          marginTop: '8px'
                        }}>
                          {user.business_units && user.business_units.length > 0 ? (
                            user.business_units.map((bu) => (
                              <span
                                key={bu}
                                style={{
                                  padding: '6px 12px',
                                  background: '#e7f3ff',
                                  color: '#004085',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  border: '1px solid #b8daff'
                                }}
                              >
                                🏢 {bu}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '14px', color: '#6c757d', fontStyle: 'italic' }}>
                              Aucune BU assignée
                            </span>
                          )}
                        </div>
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
