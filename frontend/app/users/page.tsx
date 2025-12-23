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

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nom: '',
    role: 'user'
  });

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
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
        setFormData({ email: '', password: '', nom: '', role: 'user' });
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
          <button onClick={() => router.push('/')}>Retour</button>
          <button onClick={handleLogout} style={{ background: '#dc3545' }}>
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
                    <td>{user.user_metadata?.role || 'user'}</td>
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
                  <label>Rôle</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="user">Utilisateur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelButton} onClick={() => setShowModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className={styles.primaryButton}>
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
