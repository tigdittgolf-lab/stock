'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

interface Invoice {
  nfact: number;
  nclient: string;
  date_fact: string;
  montant_ht: number;
  tva: number;
  total_ttc: number;
  created_at: string;
}

export default function InvoicesList() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch('http://localhost:3005/api/sales/invoices', {
        headers: {
          'X-Tenant': tenant
        }
      });
      const data = await response.json();
      if (data.success) {
        setInvoices(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Liste des Factures</h1>
        <div>
          <button onClick={() => router.push('/invoices')} className={styles.primaryButton}>
            Nouvelle Facture
          </button>
          <button onClick={() => router.push('/dashboard')} className={styles.secondaryButton}>
            Retour
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {loading ? (
          <p>Chargement...</p>
        ) : invoices.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Aucune facture</h2>
            <p>Vous n'avez pas encore créé de facture.</p>
            <button 
              onClick={() => router.push('/invoices')} 
              className={styles.primaryButton}
            >
              Créer la première facture
            </button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° Facture</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Montant HT</th>
                  <th style={{ textAlign: 'right' }}>TVA</th>
                  <th style={{ textAlign: 'right' }}>Total TTC</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.nfact}>
                    <td><strong>{invoice.nfact}</strong></td>
                    <td>{invoice.nclient}</td>
                    <td>{new Date(invoice.date_fact).toLocaleDateString('fr-FR')}</td>
                    <td style={{ textAlign: 'right' }}>{invoice.montant_ht?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA</td>
                    <td style={{ textAlign: 'right' }}>{invoice.tva?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA</td>
                    <td style={{ textAlign: 'right' }}><strong>{invoice.total_ttc?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA</strong></td>
                    <td>
                      <button 
                        onClick={() => router.push(`/invoices/${invoice.nfact}`)}
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