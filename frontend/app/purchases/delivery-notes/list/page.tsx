'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../../page.module.css';

interface PurchaseBL {
  nbl_achat: number;
  nfournisseur: string;
  numero_bl_fournisseur: string;
  supplier_name: string;
  date_bl: string;
  montant_ht: number;
  tva: number;
  total_ttc: number;
  created_at: string;
}

export default function PurchaseBLList() {
  const router = useRouter();
  const [bls, setBls] = useState<PurchaseBL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBLs();
  }, []);

  const fetchBLs = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch(`${window.location.origin}/api/purchases/delivery-notes`, {
        headers: {
          'X-Tenant': tenant
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setBls(data.data);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Error fetching purchase BLs:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Liste des BL d'Achat</h1>
        <div>
          <button onClick={() => router.push('/purchases/delivery-notes')} className={styles.primaryButton}>
            Nouveau BL
          </button>
          <button onClick={() => router.push('/purchases')} className={styles.secondaryButton}>
            Factures d'Achat
          </button>
          <button onClick={() => router.push('/')} className={styles.secondaryButton}>
            Retour
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {error && (
          <div className={styles.error}>
            <h2>❌ Erreur</h2>
            <p>{error}</p>
            <button onClick={fetchBLs} className={styles.primaryButton}>
              Réessayer
            </button>
          </div>
        )}

        {!error && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° BL Fournisseur</th>
                  <th>Fournisseur</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Montant HT</th>
                  <th style={{ textAlign: 'right' }}>TVA</th>
                  <th style={{ textAlign: 'right' }}>Total TTC</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bls.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                      <div>
                        <h3>Aucun BL d'achat</h3>
                        <p>Commencez par créer votre premier BL d'achat.</p>
                        <button 
                          onClick={() => router.push('/purchases/delivery-notes')} 
                          className={styles.primaryButton}
                          style={{ marginTop: '1rem' }}
                        >
                          Créer un BL d'Achat
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bls.map((bl) => (
                    <tr key={bl.nbl_achat}>
                      <td>{bl.numero_bl_fournisseur || `ID-${bl.nbl_achat}`}</td>
                      <td>{bl.supplier_name || bl.nfournisseur}</td>
                      <td>{new Date(bl.date_bl).toLocaleDateString('fr-FR')}</td>
                      <td style={{ textAlign: 'right' }}>
                        {bl.montant_ht?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {bl.tva?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong>{bl.total_ttc?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA</strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => router.push(`/purchases/delivery-notes/${bl.nbl_achat}`)}
                            className={styles.primaryButton}
                          >
                            Voir
                          </button>
                          <button 
                            onClick={() => router.push(`/purchases/delivery-notes/${bl.nbl_achat}/edit`)}
                            className={styles.secondaryButton}
                          >
                            Modifier
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {bls.length > 0 && (
          <div className={styles.summary}>
            <h3>Résumé</h3>
            <p>
              <strong>{bls.length}</strong> BL{bls.length > 1 ? 's' : ''} d'achat
            </p>
            <p>
              <strong>Total des livraisons :</strong> {' '}
              {bls.reduce((sum, bl) => sum + (bl.total_ttc || 0), 0)
                .toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA TTC
            </p>
          </div>
        )}
      </main>
    </div>
  );
}