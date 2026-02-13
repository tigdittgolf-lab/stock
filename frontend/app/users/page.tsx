'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';

// Import dynamique pour éviter les erreurs de build
let supabase: any = null;
let signOut: any = null;

if (typeof window !== 'undefined') {
  import('@/utils/supabase').then(module => {
    supabase = module.supabase;
    signOut = module.signOut;
  });
}

interface AppUser {
  id: string;
  email?: string;
  created_at: string;
  user_metadata?: any;
}

interface BusinessUnit {
  business_unit: string;
  year: number;
  schema: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nom: '',
    role: 'user',
    business_unit: '',
    year: new Date().getFullYear()
  });

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
    loadBusinessUnits();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadBusinessUnits = async () => {
    try {
      const response = await fetch(getApiUrl('database/tenants/list'));
      const data = await response.json();
      
      console.log('📋 Business units loaded:', data);
      
      if (data.success && data.data && data.data.length > 0) {
        setBusinessUnits(data.data);
        // Sélectionner la première business unit par défaut
        setFormData(prev => ({
          ...prev,
          business_unit: data.data[0].business_unit,
          year: data.data[0].year
        }));
      } else {
        console.warn('⚠️ No business units found');
        setBusinessUnits([]);
      }
    } catch (error) {
      console.error('❌ Error loading business units:', error);
      setBusinessUnits([]);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Note: Cette requête nécessite des permissions admin dans Supabase
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.error('Error loading users:', error);
      } else {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(getApiUrl('auth/create-user'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert('Utilisateur créé avec succès!');
        setShowModal(false);
        setFormData({ 
          email: '', 
          password: '', 
          nom: '', 
          role: 'user',
          business_unit: businessUnits.length > 0 ? businessUnits[0].business_unit : '',
          year: businessUnits.length > 0 ? businessUnits[0].year : new Date().getFullYear()
        });
        loadUsers();
      } else {
        alert('Erreur: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Gestion des Utilisateurs</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => router.push('/')}
            style={{
              padding: '8px 16px',
              background: 'rgba(108, 117, 125, 0.95)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            ← Retour
          </button>
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: 'rgba(220, 53, 69, 0.95)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(200, 35, 51, 0.95)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(220, 53, 69, 0.95)';
            }}
          >
            <span style={{ fontSize: '16px' }}>🚪</span>
            Déconnexion
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.sectionHeader}>
          <h2>Utilisateurs du Système</h2>
          <button className={styles.primaryButton} onClick={() => setShowModal(true)}>
            Ajouter un Utilisateur
          </button>
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nom</th>
                  <th>Rôle</th>
                  <th>Date de création</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.user_metadata?.nom || '-'}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: user.user_metadata?.role === 'admin' ? 'var(--error-color-light)' : 
                                   user.user_metadata?.role === 'manager' ? 'var(--warning-color-light)' : 
                                   'var(--info-color-light)',
                        color: 'var(--text-primary)'
                      }}>
                        {user.user_metadata?.role === 'admin' ? '👨‍💼 Admin' : 
                         user.user_metadata?.role === 'manager' ? '👔 Manager' : 
                         '👤 User'}
                      </span>
                      {user.user_metadata?.role === 'manager' && user.user_metadata?.business_unit && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {user.user_metadata.business_unit.toUpperCase()} - {user.user_metadata.year}
                        </div>
                      )}
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <span className={styles.inStock}>Actif</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className={styles.modal} onClick={() => setShowModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Créer un Utilisateur</h3>
                <button className={styles.closeButton} onClick={() => setShowModal(false)}>
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateUser} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Mot de passe *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Nom complet</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Rôle *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  >
                    <option value="user">Utilisateur</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                {/* Afficher les champs Business Unit et Exercice pour les managers */}
                {formData.role === 'manager' && (
                  <>
                    <div className={styles.formGroup}>
                      <label>Business Unit *</label>
                      {businessUnits.length === 0 ? (
                        <div style={{ 
                          padding: '12px', 
                          background: 'var(--warning-color-light)', 
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)'
                        }}>
                          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                            ⚠️ Aucune Business Unit disponible
                          </p>
                          <p style={{ margin: '0', fontSize: '14px' }}>
                            Vous devez d'abord créer une Business Unit et un exercice depuis le dashboard.
                          </p>
                        </div>
                      ) : (
                        <select
                          value={formData.business_unit}
                          onChange={(e) => setFormData({ ...formData, business_unit: e.target.value })}
                          required
                        >
                          {businessUnits.map((bu) => (
                            <option key={`${bu.business_unit}-${bu.year}`} value={bu.business_unit}>
                              {bu.business_unit.toUpperCase()} - {bu.year}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>Exercice *</label>
                      {businessUnits.length === 0 ? (
                        <input
                          type="number"
                          value={formData.year}
                          disabled
                          style={{ background: 'var(--background-secondary)', cursor: 'not-allowed' }}
                        />
                      ) : (
                        <select
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                          required
                        >
                          {Array.from(new Set(businessUnits.map(bu => bu.year))).map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </>
                )}

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelButton} onClick={() => setShowModal(false)}>
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className={styles.primaryButton}
                    disabled={formData.role === 'manager' && businessUnits.length === 0}
                    style={{
                      opacity: formData.role === 'manager' && businessUnits.length === 0 ? 0.5 : 1,
                      cursor: formData.role === 'manager' && businessUnits.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
