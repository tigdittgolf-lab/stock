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
  client_address?: string;
  details?: InvoiceDetail[];
}

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email?: string;
  nif?: string;
  rc?: string;
  art?: string;
  domaine_activite?: string;
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
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Unwrap params using React.use()
  const resolvedParams = use(params);

  useEffect(() => {
    fetchInvoice();
    fetchCompanyInfo();
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
      
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch(`${window.location.origin}/api/sales/invoices/${resolvedParams.id}`, {
        headers: {
          'X-Tenant': tenant
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

  const fetchCompanyInfo = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch('${window.location.origin}/api/sales/company-info', {
        headers: {
          'X-Tenant': tenant
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setCompanyInfo(data.data);
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
      // Fallback company info
      setCompanyInfo({
        name: 'ETS BENAMAR BOUZID MENOUAR',
        address: '10, Rue Belhandouz A.E.K, Mostaganem, Mostaganem',
        phone: '(213)045.42.35.20',
        email: 'outillagesaada@gmail.com',
        nif: '10227010185816600000',
        rc: '21A3965999-27/00',
        art: '100227010185845',
        domaine_activite: 'Commerce Outillage et Équipements'
      });
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
            onClick={async () => {
              const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
              try {
                const response = await fetch(`${window.location.origin}/api/pdf/invoice/${invoice.nfact}`, {
                  headers: {
                    'X-Tenant': tenant
                  }
                });
                
                if (response.ok) {
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  window.open(url, '_blank');
                  window.URL.revokeObjectURL(url);
                } else {
                  const errorData = await response.json();
                  console.error('PDF generation failed:', errorData);
                  alert('Erreur lors de la génération du PDF: ' + (errorData.error || 'Erreur inconnue'));
                }
              } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Erreur lors de la génération du PDF');
              }
            }} 
            className={styles.primaryButton}
            style={{ marginLeft: '10px' }}
          >
            🖨️ Imprimer
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div>
          {/* En-tête du document */}
          <div className={styles.formSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>{companyInfo?.name || 'VOTRE ENTREPRISE'}</h2>
                {companyInfo?.domaine_activite && (
                  <p style={{ fontStyle: 'italic', color: '#7f8c8d', marginBottom: '8px' }}>{companyInfo.domaine_activite}</p>
                )}
                <p style={{ marginBottom: '5px' }}>{companyInfo?.address || 'Adresse de votre entreprise'}</p>
                <p style={{ marginBottom: '5px' }}>Tél: {companyInfo?.phone || '+213 XX XX XX XX'}</p>
                <p style={{ marginBottom: '5px' }}>Email: {companyInfo?.email || 'contact@entreprise.dz'}</p>
                {companyInfo?.nif && <p style={{ fontSize: '0.9em', color: '#7f8c8d' }}>NIF: {companyInfo.nif}</p>}
                {companyInfo?.rc && <p style={{ fontSize: '0.9em', color: '#7f8c8d' }}>RC: {companyInfo.rc}</p>}
                {companyInfo?.art && <p style={{ fontSize: '0.9em', color: '#7f8c8d' }}>Art: {companyInfo.art}</p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ color: '#007bff', fontSize: '1.8rem' }}>FACTURE</h2>
                <p><strong>N° :</strong> {invoice.nfact}</p>
                <p><strong>Date :</strong> {new Date(invoice.date_fact).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>

          {/* Informations client */}
          <div className={styles.formSection}>
            <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '5px' }}>Facturé à :</h2>
            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginTop: '10px' }}>
              <p style={{ marginBottom: '8px' }}><strong>Code client :</strong> {invoice.nclient}</p>
              <p style={{ marginBottom: '8px' }}><strong>Raison sociale :</strong> {invoice.client_name || invoice.nclient}</p>
              {invoice.client_address && <p style={{ marginBottom: '8px' }}><strong>Adresse :</strong> {invoice.client_address}</p>}
            </div>
          </div>

          {/* Détails des articles */}
          <div className={styles.formSection}>
            <h2>Articles facturés :</h2>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Désignation</th>
                    <th style={{ textAlign: 'right' }}>Quantité</th>
                    <th style={{ textAlign: 'right' }}>Prix unitaire</th>
                    <th style={{ textAlign: 'right' }}>TVA (%)</th>
                    <th style={{ textAlign: 'right' }}>Total ligne</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.details && invoice.details.length > 0 ? (
                    invoice.details.map((detail, index) => (
                      <tr key={index}>
                        <td>{detail.narticle}</td>
                        <td>{detail.designation}</td>
                        <td style={{ textAlign: 'right' }}>{Math.round(detail.qte)}</td>
                        <td style={{ textAlign: 'right' }}>{parseFloat(detail.prix.toString()).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA</td>
                        <td style={{ textAlign: 'right' }}>{parseFloat(detail.tva.toString()).toFixed(0)}%</td>
                        <td style={{ textAlign: 'right' }}>{parseFloat(detail.total_ligne.toString()).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA</td>
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
          </div>

          {/* Totaux */}
          <div className={styles.totalsSection}>
            <div className={styles.totalsGrid}>
              <div className={styles.totalRow}>
                <span>Montant HT :</span>
                <span>{invoice.montant_ht?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA</span>
              </div>
              <div className={styles.totalRow}>
                <span>TVA :</span>
                <span>{invoice.tva?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA</span>
              </div>
              <div className={styles.totalRow}>
                <strong>Total TTC :</strong>
                <strong>{(invoice.total_ttc || (invoice.montant_ht + invoice.tva))?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA</strong>
              </div>
            </div>
          </div>

          {/* Conditions de paiement */}
          <div className={styles.formSection}>
            <h2>Conditions de paiement :</h2>
            <p>Paiement à 30 jours fin de mois</p>
            <p>En cas de retard de paiement, des pénalités pourront être appliquées.</p>
          </div>

          {/* Informations de création */}
          <div className={styles.formSection} style={{ textAlign: 'center', color: '#666' }}>
            <p><small>Facture créée le : {new Date(invoice.created_at).toLocaleString('fr-FR')}</small></p>
          </div>
        </div>
      </main>


    </div>
  );
}