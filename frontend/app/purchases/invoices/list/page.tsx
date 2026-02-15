'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from '../../../page.module.css';

interface PurchaseInvoice {
  nfact_achat: number;
  nfournisseur: string;
  numero_facture_fournisseur: string;
  supplier_name: string;
  date_fact: string;
  montant_ht: number;
  tva: number;
  total_ttc: number;
  created_at: string;
}

export default function PurchaseInvoicesList() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch(getApiUrl('purchases/invoices'), {
        headers: {
          'X-Tenant': tenant
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setInvoices(data.data);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Error fetching purchase invoices:', error);
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
        <h1>Liste des Factures d'Achat</h1>
        <div>
          <button onClick={() => router.push('/purchases')} className={styles.primaryButton}>
            Nouvelle Facture
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
            <button onClick={fetchInvoices} className={styles.primaryButton}>
              Réessayer
            </button>
          </div>
        )}

        {!error && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° Facture Fournisseur</th>
                  <th>Fournisseur</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Montant HT</th>
                  <th style={{ textAlign: 'right' }}>TVA</th>
                  <th style={{ textAlign: 'right' }}>Total TTC</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                      <div>
                        <h3>Aucune facture d'achat</h3>
                        <p>Commencez par créer votre première facture d'achat.</p>
                        <button 
                          onClick={() => router.push('/purchases')} 
                          className={styles.primaryButton}
                          style={{ marginTop: '1rem' }}
                        >
                          Créer une Facture d'Achat
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.nfact_achat}>
                      <td>{invoice.numero_facture_fournisseur || `ID-${invoice.nfact_achat}`}</td>
                      <td>{invoice.supplier_name || invoice.nfournisseur}</td>
                      <td>{new Date(invoice.date_fact).toLocaleDateString('fr-FR')}</td>
                      <td style={{ textAlign: 'right' }}>
                        {invoice.montant_ht?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {invoice.tva?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong>{invoice.total_ttc?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA</strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => router.push(`/purchases/invoices/${invoice.nfact_achat}`)}
                            className={styles.primaryButton}
                          >
                            Voir
                          </button>
                          <button 
                            onClick={() => router.push(`/purchases/invoices/${invoice.nfact_achat}/edit`)}
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

        {invoices.length > 0 && (
          <div className={styles.summary}>
            <h3>Résumé</h3>
            <p>
              <strong>{invoices.length}</strong> facture{invoices.length > 1 ? 's' : ''} d'achat
            </p>
            <p>
              <strong>Total des achats :</strong> {' '}
              {invoices.reduce((sum, inv) => sum + (inv.total_ttc || 0), 0)
                .toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA TTC
            </p>
          </div>
        )}
      </main>
    </div>
  );
}