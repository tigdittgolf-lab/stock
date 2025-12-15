'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

interface Proforma {
  nfprof: number;
  nclient: string;
  date_fact: string;
  montant_ht: number;
  tva: number;
  total_ttc: number;
  created_at: string;
}

export default function ProformaList() {
  const router = useRouter();
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProformas();
  }, []);

  const fetchProformas = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch('http://localhost:3005/api/sales/proforma', {
        headers: {
          'X-Tenant': tenant
        }
      });
      const data = await response.json();
      if (data.success) {
        setProformas(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching proformas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Liste des Factures Proforma</h1>
        <div>
          <button onClick={() => router.push('/proforma')} className={styles.primaryButton}>
            Nouvelle Proforma
          </button>
          <button onClick={() => router.push('/dashboard')} className={styles.secondaryButton}>
            Retour
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {loading ? (
          <p>Chargement...</p>
        ) : proformas.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Aucune facture proforma</h2>
            <p>Vous n'avez pas encore créé de facture proforma.</p>
            <button 
              onClick={() => router.push('/proforma')} 
              className={styles.primaryButton}
            >
              Créer la première proforma
            </button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° Proforma</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Montant HT</th>
                  <th>TVA</th>
                  <th>Total TTC</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {proformas.map((proforma) => (
                  <tr key={proforma.nfprof}>
                    <td><strong>{proforma.nfprof}</strong></td>
                    <td>{proforma.nclient}</td>
                    <td>{new Date(proforma.date_fact).toLocaleDateString('fr-FR')}</td>
                    <td>{proforma.montant_ht?.toFixed(2)} DA</td>
                    <td>{proforma.tva?.toFixed(2)} DA</td>
                    <td><strong>{proforma.total_ttc?.toFixed(2)} DA</strong></td>
                    <td>
                      <button 
                        onClick={() => router.push(`/proforma/${proforma.nfprof}`)}
                        className={styles.viewButton}
                      >
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}