'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import styles from '../../../page.module.css';

interface PurchaseInvoiceDetail {
  nfact_achat: number;
  nfournisseur: string;
  numero_facture_fournisseur: string;
  supplier_name: string;
  supplier_address: string;
  date_fact: string;
  montant_ht: number;
  tva: number;
  total_ttc: number;
  created_at: string;
  details: Array<{
    narticle: string;
    designation: string;
    qte: number;
    prix: number;
    tva: number;
    total_ligne: number;
  }>;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PurchaseInvoiceDetail({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const invoiceId = resolvedParams.id;
  
  const [invoice, setInvoice] = useState<PurchaseInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch(getApiUrl(`purchases/invoices/${invoiceId}`), {
        headers: {
          'X-Tenant': tenant
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setInvoice(data.data);
      } else {
        setError(data.error || 'Facture d\'achat non trouvée');
      }
    } catch (error) {
      console.error('Error fetching purchase invoice:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0.00';
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <h2>❌ Erreur</h2>
          <p>{error}</p>
          <button onClick={() => router.push('/purchases/invoices/list')} className={styles.primaryButton}>
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Facture d'Achat - {invoice.numero_facture_fournisseur || `ID-${invoice.nfact_achat}`}</h1>
        <div>
          <button 
            onClick={() => router.push(`/purchases/invoices/${invoice.nfact_achat}/edit`)}
            className={styles.primaryButton}
          >
            Modifier
          </button>
          <button onClick={() => router.push('/purchases/invoices/list')} className={styles.secondaryButton}>
            Retour à la liste
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Informations générales */}
        <div className={styles.invoiceSection}>
          <h2>Informations Générales</h2>
          <div className={styles.invoiceGrid}>
            <div className={styles.invoiceField}>
              <label>N° Facture Fournisseur :</label>
              <span>{invoice.numero_facture_fournisseur || 'Non spécifié'}</span>
            </div>
            <div className={styles.invoiceField}>
              <label>ID Interne :</label>
              <span>{invoice.nfact_achat}</span>
            </div>
            <div className={styles.invoiceField}>
              <label>Fournisseur :</label>
              <span>{invoice.supplier_name || invoice.nfournisseur}</span>
            </div>
            <div className={styles.invoiceField}>
              <label>Date de Facture :</label>
              <span>{new Date(invoice.date_fact).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className={styles.invoiceField}>
              <label>Adresse Fournisseur :</label>
              <span>{invoice.supplier_address || 'Non spécifiée'}</span>
            </div>
            <div className={styles.invoiceField}>
              <label>Date de Création :</label>
              <span>{new Date(invoice.created_at).toLocaleDateString('fr-FR')} à {new Date(invoice.created_at).toLocaleTimeString('fr-FR')}</span>
            </div>
          </div>
        </div>

        {/* Détails des articles */}
        <div className={styles.invoiceSection}>
          <h2>Articles Achetés</h2>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Désignation</th>
                  <th style={{ textAlign: 'right' }}>Quantité</th>
                  <th style={{ textAlign: 'right' }}>Prix Unitaire</th>
                  <th style={{ textAlign: 'right' }}>TVA (%)</th>
                  <th style={{ textAlign: 'right' }}>Total Ligne</th>
                </tr>
              </thead>
              <tbody>
                {invoice.details?.map((detail, index) => (
                  <tr key={index}>
                    <td>{detail.narticle}</td>
                    <td>{detail.designation}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(detail.qte)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(detail.prix)} DA</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(detail.tva)}%</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(detail.total_ligne)} DA</td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                      Aucun détail disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totaux */}
        <div className={styles.invoiceSection}>
          <h2>Totaux</h2>
          <div className={styles.totalsGrid}>
            <div className={styles.totalRow}>
              <span>Montant HT :</span>
              <span>{formatNumber(invoice.montant_ht)} DA</span>
            </div>
            <div className={styles.totalRow}>
              <span>TVA :</span>
              <span>{formatNumber(invoice.tva)} DA</span>
            </div>
            <div className={styles.totalRow}>
              <strong>Total TTC :</strong>
              <strong>{formatNumber(invoice.total_ttc)} DA</strong>
            </div>
          </div>
        </div>

        {/* Informations sur les stocks */}
        <div className={styles.invoiceSection}>
          <div className={styles.stockInfo}>
            <h3>📦 Impact sur les Stocks</h3>
            <p>Cette facture d'achat a généré une <strong>entrée de stock</strong> pour tous les articles listés.</p>
            <p>Les quantités ont été ajoutées au stock facture (stock_f) de chaque article.</p>
          </div>
        </div>
      </main>
    </div>
  );
}