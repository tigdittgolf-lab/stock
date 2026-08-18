'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiRequest, getApiUrl } from '@/lib/api';
import styles from '../page.module.css';

interface LicenseStatus {
  success: boolean;
  machineId: string;
  bu: string;
  status: string;
  type: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  daysLeft: number | null;
  valid: boolean;
}

export default function LicensePage() {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/license');
      const data = await res.json();
      if (data.success) {
        setStatus(data);
      } else {
        setStatus(null);
        setMessage({ type: 'err', text: 'Impossible de lire l\'état de la licence.' });
      }
    } catch (e) {
      console.error('Erreur statut licence:', e);
      setMessage({ type: 'err', text: 'Backend injoignable.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const activate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setMessage({ type: 'err', text: 'Veuillez saisir une clé.' });
      return;
    }
    setActivating(true);
    setMessage(null);
    try {
      const res = await apiRequest('/license/activate', {
        method: 'POST',
        body: JSON.stringify({ key: key.trim() }),
      });
      const data = await res.json();
      if (res.status === 200) {
        setMessage({ type: 'ok', text: data.message || 'Licence activée.' });
        setKey('');
        fetchStatus();
      } else {
        setMessage({ type: 'err', text: data.error || 'Clé invalide.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'err', text: 'Erreur lors de l\'activation.' });
    } finally {
      setActivating(false);
    }
  };

  const statusLabel = (st: string | undefined, valid: boolean, daysLeft: number | null) => {
    if (valid && st === 'active') return { text: 'ACTIVÉE', cls: 'badgeOk' };
    if (st === 'trial') return { text: daysLeft !== null && daysLeft <= 15 ? `ESSAI (${daysLeft} j restants)` : 'ESSAI', cls: daysLeft !== null && daysLeft <= 5 ? 'badgeWarn' : 'badgeOk' };
    if (st === 'expired') return { text: 'ESSAI EXPIRÉ', cls: 'badgeErr' };
    return { text: 'NON ACTIVÉE', cls: 'badgeErr' };
  };

  const badge = status ? statusLabel(status.status, status.valid, status.daysLeft) : null;

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem' }}>
          <h1 className={styles.title} style={{ fontSize: '1.8rem' }}>Licence StockApp</h1>

          {loading && <p>Chargement de l'état de la licence...</p>}

          {status && badge && (
            <div
              style={{
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: '1.2rem 1.4rem',
                margin: '1.2rem 0',
                background: '#f9fafb',
              }}
            >
              <p>
                <strong>État :</strong>{' '}
                <span style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>{badge.text}</span>
              </p>
              {status.type && <p><strong>Type :</strong> {status.type === 'PERP' ? 'Licence durable' : `Essai (${status.type.replace('T', '')} jours)`}</p>}
              {status.daysLeft !== null && <p><strong>Jours restants :</strong> {status.daysLeft}</p>}
              {status.expiresAt && <p><strong>Expire le :</strong> {new Date(status.expiresAt).toLocaleDateString('fr-FR')}</p>}
              <p><strong>Raison sociale / BU :</strong> {status.bu}</p>
              <p>
                <strong>ID machine :</strong> <code style={{ background: '#eee', padding: '2px 6px', borderRadius: 4 }}>{status.machineId}</code>
              </p>

              {!status.valid && (
                <p style={{ marginTop: '0.8rem', fontSize: '0.95rem' }}>
                  Transmettez cet ID machine à votre fournisseur pour recevoir votre clé d'activation.
                </p>
              )}
            </div>
          )}

          {!status?.valid && (
            <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: '1.2rem 1.4rem', marginTop: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Activer une licence</h2>
              <form onSubmit={activate} style={{ display: 'flex', gap: 8, marginTop: '0.6rem' }}>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="LIC-T30-2025_bu01-XXXX-XXXX"
                  style={{ flex: 1, padding: '0.5rem 0.7rem', borderRadius: 6, border: '1px solid #999', fontFamily: 'monospace' }}
                />
                <button
                  type="submit"
                  disabled={activating}
                  style={{ padding: '0.5rem 1.2rem', borderRadius: 6, border: 'none', background: 'var(--green)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  {activating ? '...' : 'Activer'}
                </button>
              </form>
              {process.env.NEXT_PUBLIC_LICENSE_TRIAL === '1' && (
                <button
                  onClick={async () => {
                    const res = await fetch(getApiUrl('/license/trial'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'X-Tenant': status?.bu || '2025_bu01' },
                    });
                    const d = await res.json();
                    if (res.ok) setMessage({ type: 'ok', text: d.message || 'Essai démarré.' });
                    else setMessage({ type: 'err', text: d.error || 'Essai non disponible.' });
                    fetchStatus();
                  }}
                  style={{ marginTop: '0.8rem', padding: '0.4rem 0.9rem', borderRadius: 6, border: '1px solid #999', background: 'none', cursor: 'pointer' }}
                >
                  Démarrer un essai de 15 jours
                </button>
              )}
            </div>
          )}

          {message && (
            <p style={{ marginTop: '1rem', padding: '0.6rem 0.9rem', borderRadius: 6, background: message.type === 'ok' ? '#d1fae5' : '#fee2e2', color: message.type === 'ok' ? '#065f46' : '#991b1b' }}>
              {message.text}
            </p>
          )}

          <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#667' }}>
            Après activation, l'ensemble des opérations (ventes, stock, achats, bons de livraison,
            factures, rapports) sera débloqué.
          </p>
        </div>
      </main>
    </div>
  );
}