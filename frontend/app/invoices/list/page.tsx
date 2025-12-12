'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

interface Invoice {
  nfact: number;
  date_fact: string;
  nclient: string;
  montant_ht: number;
  tva: number;
  timbre: number;
  autre_taxe: number;
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
      const response = await fetch('http://localhost:3005/api/sales/invoices');
      const data = await response.json();
      if (data.success) {
        setInvoices(data.data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = (invoiceId: number) => {
    // Open PDF in new tab
    window.open(`http://localhost:3005/api/pdf/invoice/${invoiceId}`, '_blank');
  };

  const calculateTotal = (invoice: Invoice) => {
    return invoice.montant_ht + invoice.tva + invoice.timbre + invoice.autre_taxe;
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.main}>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Liste des Factures</h1>
        <div>
          <button onClick={() => router.push('/invoices')} className={styles.primaryButton}>
            Nouvelle Facture
          </button>
          <button onClick={() => router.push('/')} className={styles.secondaryButton}>
            Retour
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Date</th>
                <th>Client</th>
                <th>Montant HT</th>
                <th>TVA</th>
                <th>Total TTC</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>
                    Aucune facture trouvée
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.nfact}>
                    <td>{invoice.nfact}</td>
                    <td>{new Date(invoice.date_fact).toLocaleDateString('fr-FR')}</td>
                    <td>{invoice.nclient}</td>
                    <td>{invoice.montant_ht.toFixed(2)} DA</td>
                    <td>{invoice.tva.toFixed(2)} DA</td>
                    <td><strong>{calculateTotal(invoice).toFixed(2)} DA</strong></td>
                    <td>
                      <button
                        onClick={() => handlePrintInvoice(invoice.nfact)}
                        className={styles.primaryButton}
                        style={{ marginRight: '5px' }}
                      >
                        📄 Imprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
