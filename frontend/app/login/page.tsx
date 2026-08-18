'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/utils/supabase';
import { getApiUrl } from '@/lib/api';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeDbName, setActiveDbName] = useState<string | null>(null);

  // Récupérer la base active depuis le backend (badge informatif uniquement)
  useEffect(() => {
    const loadDb = async () => {
      try {
        const res = await fetch(getApiUrl('database-config'));
        const data = await res.json();
        const cfg = data?.data;
        if (cfg && cfg.name) {
          setActiveDbName(cfg.name);
          const type = cfg.type || 'supabase';
          localStorage.setItem('activeDbConfig', JSON.stringify({ type, name: cfg.name, ...cfg }));
        }
      } catch (e) {
        console.warn('Impossible de lire la base active:', e);
      }
    };
    loadDb();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // La base de données active est celle configurée sur le serveur (persistante)
      let dbType = 'supabase';
      try {
        const cfg = localStorage.getItem('activeDbConfig');
        if (cfg) dbType = JSON.parse(cfg).type || 'supabase';
      } catch { /* ignore */ }

      console.log(`📊 Base de données active: ${dbType}`);

      // Utiliser le nouveau système d'authentification
      const response = await fetch(getApiUrl('auth-real/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Database-Type': dbType
        },
        body: JSON.stringify({
          username: email, // Accepte email OU username
          password: password
        })
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Erreur lors de la connexion');
        setLoading(false);
        return;
      }

      // Stocker le token et les infos utilisateur
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user_info', JSON.stringify(result.user));

      console.log('✅ Connexion réussie:', result.user);

      // Rediriger vers la sélection du tenant
      router.push('/tenant-selection');
      router.refresh();
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError('Une erreur est survenue lors de la connexion');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <h1>Système de Gestion de Stock</h1>
          <p>Connectez-vous pour continuer</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {/* Base de données active (badge informatif - configurable par l'admin dans Paramètres) */}
          <div className={styles.formGroup}>
            <label htmlFor="database">Base de données active</label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '8px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#e7f3ff',
              border: '1px solid #b8daff',
            }}>
              <span style={{ fontSize: '24px' }}>
                {activeDbName?.toLowerCase().includes('supabase') ? '☁️' : activeDbName?.toLowerCase().includes('postgres') ? '🐘' : activeDbName?.toLowerCase().includes('maria') ? '🦭' : '🐬'}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#004085' }}>
                {activeDbName || 'Chargement...'}
              </span>
            </div>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              marginTop: '8px',
              textAlign: 'center'
            }}>
              La base est configurée lors de l'installation. L'administrateur peut la modifier dans Paramètres.
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email ou Username</label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin ou admin@example.com"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading}
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '5px',
                  color: '#666'
                }}
                title={showPassword ? 'Cacher le mot de passe' : 'Voir le mot de passe'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className={styles.footer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <p style={{ margin: 0 }}>Première connexion? Contactez l'administrateur</p>
            <button
              onClick={() => router.push('/forgot-password')}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc3545',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Mot de passe oublié ?
            </button>
          </div>
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            background: '#e7f3ff', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#004085'
          }}>
            <strong>Comptes de test :</strong><br />
            👨‍💼 Admin: <code>admin</code> / <code>admin123</code><br />
            👔 Manager: <code>manager</code> / <code>manager123</code><br />
            👤 User: <code>user</code> / <code>user123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
