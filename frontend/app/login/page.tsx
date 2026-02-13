'use client';

import { useState } from 'react';
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
  const [selectedDatabase, setSelectedDatabase] = useState<'supabase' | 'mysql' | 'mariadb' | 'postgresql'>('supabase');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Configurer la base de données AVANT la connexion
      const dbConfigs = {
        supabase: {
          type: 'supabase',
          name: 'Supabase Cloud',
          supabaseUrl: 'https://szgodrjglbpzkrksnroi.supabase.co'
        },
        mysql: {
          type: 'mysql',
          name: 'MySQL Local',
          host: 'localhost',
          port: 3306,
          database: 'stock_management',
          username: 'root',
          password: ''
        },
        mariadb: {
          type: 'mysql',
          name: 'MariaDB Local (WAMP)',
          host: 'localhost',
          port: 3307,
          database: 'stock_management',
          username: 'root',
          password: ''
        },
        postgresql: {
          type: 'postgresql',
          name: 'PostgreSQL Local',
          host: 'localhost',
          port: 5432,
          database: 'stock_management',
          username: 'postgres',
          password: 'postgres'
        }
      };

      const dbConfig = dbConfigs[selectedDatabase];
      
      // Sauvegarder la configuration de la base de données
      localStorage.setItem('activeDbConfig', JSON.stringify({
        ...dbConfig,
        isActive: true,
        lastTested: new Date().toISOString()
      }));

      console.log(`📊 Base de données sélectionnée: ${dbConfig.name}`);

      // Pour MariaDB, on envoie 'mysql' comme type au backend
      const backendDbType = selectedDatabase === 'mariadb' ? 'mysql' : selectedDatabase;

      // Utiliser le nouveau système d'authentification
      const response = await fetch(getApiUrl('auth-real/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Database-Type': backendDbType
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

          {/* Sélection de la base de données */}
          <div className={styles.formGroup}>
            <label htmlFor="database">Base de données</label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '10px',
              marginTop: '8px'
            }}>
              <button
                type="button"
                onClick={() => setSelectedDatabase('supabase')}
                disabled={loading}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: selectedDatabase === 'supabase' ? '2px solid #3ecf8e' : '1px solid #e5e7eb',
                  backgroundColor: selectedDatabase === 'supabase' ? '#3ecf8e15' : 'white',
                  color: selectedDatabase === 'supabase' ? '#3ecf8e' : '#6b7280',
                  fontSize: '13px',
                  fontWeight: selectedDatabase === 'supabase' ? '600' : '400',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '24px' }}>☁️</span>
                <span>Supabase</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>Cloud</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDatabase('mysql')}
                disabled={loading}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: selectedDatabase === 'mysql' ? '2px solid #00758f' : '1px solid #e5e7eb',
                  backgroundColor: selectedDatabase === 'mysql' ? '#00758f15' : 'white',
                  color: selectedDatabase === 'mysql' ? '#00758f' : '#6b7280',
                  fontSize: '13px',
                  fontWeight: selectedDatabase === 'mysql' ? '600' : '400',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '24px' }}>🐬</span>
                <span>MySQL</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>Port 3306</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDatabase('mariadb')}
                disabled={loading}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: selectedDatabase === 'mariadb' ? '2px solid #c0765a' : '1px solid #e5e7eb',
                  backgroundColor: selectedDatabase === 'mariadb' ? '#c0765a15' : 'white',
                  color: selectedDatabase === 'mariadb' ? '#c0765a' : '#6b7280',
                  fontSize: '13px',
                  fontWeight: selectedDatabase === 'mariadb' ? '600' : '400',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '24px' }}>🦭</span>
                <span>MariaDB</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>WAMP 3307</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDatabase('postgresql')}
                disabled={loading}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: selectedDatabase === 'postgresql' ? '2px solid #336791' : '1px solid #e5e7eb',
                  backgroundColor: selectedDatabase === 'postgresql' ? '#33679115' : 'white',
                  color: selectedDatabase === 'postgresql' ? '#336791' : '#6b7280',
                  fontSize: '13px',
                  fontWeight: selectedDatabase === 'postgresql' ? '600' : '400',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '24px' }}>🐘</span>
                <span>PostgreSQL</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>Port 5432</span>
              </button>
            </div>
            <p style={{ 
              fontSize: '12px', 
              color: '#6b7280', 
              marginTop: '8px',
              textAlign: 'center'
            }}>
              {selectedDatabase === 'supabase' && '☁️ Base de données cloud hébergée'}
              {selectedDatabase === 'mysql' && '🐬 Base de données MySQL locale (port 3306)'}
              {selectedDatabase === 'mariadb' && '🦭 Base de données MariaDB locale WAMP (port 3307)'}
              {selectedDatabase === 'postgresql' && '🐘 Base de données PostgreSQL locale (port 5432)'}
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
