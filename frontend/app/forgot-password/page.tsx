'use client';

import { useState } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from '../login/login.module.css';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState(''); // Pour le développement

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(getApiUrl('auth-real/forgot-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (result.success) {
        setMessage(result.message);
        // En développement, afficher le token
        if (result.dev_token) {
          setResetToken(result.dev_token);
        }
      } else {
        setError(result.error || 'Erreur lors de la demande');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <h1>Récupération de mot de passe</h1>
          <p>Entrez votre email ou username pour recevoir un lien de récupération</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

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

          {resetToken && (
            <div style={{
              background: '#fff3cd',
              color: '#856404',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px',
              border: '1px solid #ffeaa7'
            }}>
              <strong>🔧 Mode Développement :</strong><br />
              <small>Token de récupération : <code>{resetToken}</code></small><br />
              <button
                type="button"
                onClick={() => router.push(`/reset-password?token=${resetToken}`)}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#ffc107',
                  color: '#212529',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Utiliser ce token →
              </button>
            </div>
          )}

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

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Envoi...' : 'Envoyer le lien de récupération'}
          </button>
        </form>

        <div className={styles.footer}>
          <button
            onClick={() => router.push('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
}