'use client';

import { useState, useEffect, use } from 'react';
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
  client_name: string;
  details?: InvoiceDetail[];
}

interface InvoiceDetail {
  narticle: string;
  designation: string;
  qte: number;
  prix: number;
  tva: number;
  total_ligne: number;
}

export default function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Unwrap params using React.use()
  const resolvedParams = use(params);

  useEffect(() => {
    fetchInvoice();
  }, []);

  const fetchInvoice = async () => {
    try {
      console.log('🔍 Fetching invoice with params:', resolvedParams);
      console.log('🔍 ID parameter:', resolvedParams.id, 'type:', typeof resolvedParams.id);
      
      if (!resolvedParams.id || resolvedParams.id === 'undefined') {
        setError('ID de facture invalide');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`http://localhost:3005/api/sales/invoices/${resolvedParams.id}`, {
        headers: {
          'X-Tenant': '2025_bu01'
        }
      });
      
      if (response.status === 404) {
        setError('Facture non trouvée');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setInvoice(data.data);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
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

  if (error) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Erreur</h1>
          <button onClick={() => router.push('/invoices/list')} className={styles.secondaryButton}>
            Retour à la liste
          </button>
        </header>
        <main className={styles.main}>
          <div className={styles.error}>
            <h2>❌ {error}</h2>
            <p>La facture demandée n'a pas pu être chargée.</p>
            <button 
              onClick={() => router.push('/invoices/list')} 
              className={styles.primaryButton}
            >
              Retour à la liste
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Facture non trouvée</h1>
          <button onClick={() => router.push('/invoices/list')} className={styles.secondaryButton}>
            Retour à la liste
          </button>
        </header>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Facture N° {invoice.nfact}</h1>
        <div>
          <button onClick={() => router.push('/invoices/list')} className={styles.secondaryButton}>
            Retour à la liste
          </button>
          <button 
            onClick={() => window.print()} 
            className={styles.primaryButton}
            style={{ marginLeft: '10px' }}
          >
            🖨️ Imprimer
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.documentContainer}>
          {/* En-tête du document */}
          <div className={styles.documentHeader}>
            <div className={styles.companyInfo}>
              <h2>VOTRE ENTREPRISE</h2>
              <p>Adresse de votre entreprise</p>
              <p>Téléphone : +213 XX XX XX XX</p>
              <p>Email : contact@entreprise.dz</p>
            </div>
            <div className={styles.documentInfo}>
              <h3>FACTURE</h3>
              <p><strong>N° :</strong> {invoice.nfact}</p>
              <p><strong>Date :</strong> {new Date(invoice.date_fact).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* Informations client */}
          <div className={styles.clientInfo}>
            <h3>Facturé à :</h3>
            <div className={styles.clientDetails}>
              <p><strong>Code :</strong> {invoice.nclient}</p>
              <p><strong>Raison sociale :</strong> {invoice.client_name || invoice.nclient}</p>
            </div>
          </div>

          {/* Détails des articles */}
          <div className={styles.itemsSection}>
            <h3>Articles facturés :</h3>
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Désignation</th>
                  <th>Quantité</th>
                  <th>Prix unitaire</th>
                  <th>TVA (%)</th>
                  <th>Total ligne</th>
                </tr>
              </thead>
              <tbody>
                {invoice.details && invoice.details.length > 0 ? (
                  invoice.details.map((detail, index) => (
                    <tr key={index}>
                      <td>{detail.narticle}</td>
                      <td>{detail.designation}</td>
                      <td>{detail.qte}</td>
                      <td>{parseFloat(detail.prix.toString()).toFixed(2)} DA</td>
                      <td>{parseFloat(detail.tva.toString()).toFixed(0)}%</td>
                      <td>{parseFloat(detail.total_ligne.toString()).toFixed(2)} DA</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', fontStyle: 'italic' }}>
                      Détails des articles non disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className={styles.totalsSection}>
            <div className={styles.totalsGrid}>
              <div className={styles.totalRow}>
                <span>Montant HT :</span>
                <span>{invoice.montant_ht?.toFixed(2)} DA</span>
              </div>
              <div className={styles.totalRow}>
                <span>TVA :</span>
                <span>{invoice.tva?.toFixed(2)} DA</span>
              </div>
              <div className={styles.totalRow}>
                <strong>Total TTC :</strong>
                <strong>{invoice.total_ttc?.toFixed(2)} DA</strong>
              </div>
            </div>
          </div>

          {/* Conditions de paiement */}
          <div className={styles.paymentSection}>
            <h4>Conditions de paiement :</h4>
            <p>Paiement à 30 jours fin de mois</p>
            <p>En cas de retard de paiement, des pénalités pourront être appliquées.</p>
          </div>

          {/* Informations de création */}
          <div className={styles.metaInfo}>
            <p><small>Facture créée le : {new Date(invoice.created_at).toLocaleString('fr-FR')}</small></p>
          </div>
        </div>
      </main>

      <style jsx>{`
        .documentContainer {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        .documentHeader {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #333;
        }

        .companyInfo h2 {
          color: #333;
          margin-bottom: 10px;
        }

        .documentInfo {
          text-align: right;
        }

        .documentInfo h3 {
          color: #333;
          font-size: 24px;
          margin-bottom: 10px;
        }

        .clientInfo {
          margin-bottom: 30px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 5px;
        }

        .clientDetails {
          margin-top: 10px;
        }

        .itemsSection {
          margin-bottom: 30px;
        }

        .itemsTable {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        .itemsTable th,
        .itemsTable td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
        }

        .itemsTable th {
          background-color: #f8f9fa;
          font-weight: bold;
        }

        .totalsGrid {
          max-width: 300px;
          margin-left: auto;
        }

        .totalRow {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #eee;
        }

        .totalRow:last-child {
          border-bottom: 2px solid #333;
          font-size: 18px;
          margin-top: 10px;
          padding-top: 10px;
        }

        .paymentSection {
          margin-top: 40px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 5px;
        }

        .paymentSection h4 {
          margin-bottom: 10px;
          color: #333;
        }

        .metaInfo {
          text-align: center;
          color: #666;
          border-top: 1px solid #eee;
          padding-top: 15px;
          margin-top: 30px;
        }

        @media print {
          .documentContainer {
            box-shadow: none;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}