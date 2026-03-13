'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

interface SupplierDebt {
  nfournisseur: string;
  nom_fournisseur: string;
  total_achats: number;
  total_paye: number;
  dette: number;
  nb_documents: number;
}

export default function SupplierDebts() {
  const router = useRouter();
  const [debts, setDebts] = useState<SupplierDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSupplierDebts();
  }, []);

  const fetchSupplierDebts = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2009_bu02';
      
      // Pour l'instant, on va calculer les dettes côté client
      // TODO: Créer un endpoint backend dédié
      
      const response = await fetch(`/api/suppliers/debts`, {
        headers: {
          'X-Tenant': tenant
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des dettes');
      }

      const data = await response.json();
      
      if (data.success) {
        setDebts(data.data);
      } else {
        setError(data.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Error fetching supplier debts:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const totalDette = debts.reduce((sum, d) => sum + d.dette, 0);

  if (loading) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1>Chargement...</h1>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>💰 Dettes Fournisseurs</h1>
          <button onClick={() => router.push('/')} className={styles.secondaryButton}>
            ← Retour
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            <p>❌ {error}</p>
          </div>
        )}

        {/* Résumé */}
        <div className={styles.formSection} style={{ marginBottom: '2rem' }}>
          <h2>📊 Résumé</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Fournisseurs avec dettes</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>
                {debts.filter(d => d.dette > 0).length}
              </div>
            </div>
            <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Dette totale</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>
                {totalDette.toFixed(2)} DA
              </div>
            </div>
          </div>
        </div>

        {/* Liste des dettes */}
        <div className={styles.formSection}>
          <h2>📋 Détail par Fournisseur</h2>
          
          {debts.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              ✅ Aucune dette fournisseur
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Fournisseur</th>
                  <th>Total Achats</th>
                  <th>Total Payé</th>
                  <th>Dette</th>
                  <th>Documents</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((debt) => (
                  <tr key={debt.nfournisseur}>
                    <td>{debt.nfournisseur}</td>
                    <td>{debt.nom_fournisseur}</td>
                    <td>{debt.total_achats.toFixed(2)} DA</td>
                    <td style={{ color: '#28a745' }}>{debt.total_paye.toFixed(2)} DA</td>
                    <td style={{ 
                      color: debt.dette > 0 ? '#dc3545' : '#28a745',
                      fontWeight: debt.dette > 0 ? 'bold' : 'normal'
                    }}>
                      {debt.dette.toFixed(2)} DA
                    </td>
                    <td>{debt.nb_documents}</td>
                    <td>
                      <button
                        onClick={() => router.push(`/suppliers/${debt.nfournisseur}/payments`)}
                        className={styles.primaryButton}
                        style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                      >
                        Voir détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
