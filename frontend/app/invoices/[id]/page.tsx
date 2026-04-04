'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';
import PaymentSummary from '@/components/payments/PaymentSummary';
import PaymentForm from '@/components/payments/PaymentForm';
import PaymentHistory from '@/components/payments/PaymentHistory';

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

  // Payment states
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [refreshPaymentTrigger, setRefreshPaymentTrigger] = useState(0);

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
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? (JSON.parse(dbConfig).type || 'supabase') : 'supabase';
      const response = await fetch(`/api/sales/invoices?id=${resolvedParams.id}`, {
        headers: {
          'X-Tenant': tenant,
          'X-Database-Type': dbType
        }
      });
      
      if (response.status === 404) {
        setError('Facture non trouvée');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        const raw = data.data;
        // Normalize details — API returns detail_fact or details
        raw.details = raw.details || raw.detail_fact || [];
        setInvoice(raw);
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
      console.log('🏢 Fetching company info for tenant:', tenant);
      
      const response = await fetch(`/api/settings/activities`, {
        headers: {
          'X-Tenant': tenant
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Company info response:', data);
        
        if (data.success && data.data && data.data.length > 0) {
          const activity = data.data[0];
          setCompanyInfo({
            name: activity.nom_entreprise || 'ETS BENAMAR BOUZID MENOUAR',
            address: activity.adresse || '10, Rue Belhandouz A.E.K, Mostaganem',
            phone: activity.telephone || '(213)045.42.35.20',
            email: activity.email || 'outillagesaada@gmail.com',
            nif: activity.nif || '10227010185816600000',
            rc: activity.rc || '21A3965999-27/00',
            art: activity.art || '100227010185845',
            domaine_activite: activity.activite || 'Commerce Outillage et Équipements'
          });
          console.log('✅ Company info set from database');
        } else {
          console.warn('⚠️ No company data found, using defaults');
          setCompanyInfo({
            name: 'ETS BENAMAR BOUZID MENOUAR',
            address: '10, Rue Belhandouz A.E.K, Mostaganem',
            phone: '(213)045.42.35.20',
            email: 'outillagesaada@gmail.com',
            nif: '10227010185816600000',
            rc: '21A3965999-27/00',
            art: '100227010185845',
            domaine_activite: 'Commerce Outillage et Équipements'
          });
        }
      } else {
        console.warn('⚠️ Could not fetch company info, using defaults');
        setCompanyInfo({
          name: 'ETS BENAMAR BOUZID MENOUAR',
          address: '10, Rue Belhandouz A.E.K, Mostaganem',
          phone: '(213)045.42.35.20',
          email: 'outillagesaada@gmail.com',
          nif: '10227010185816600000',
          rc: '21A3965999-27/00',
          art: '100227010185845',
          domaine_activite: 'Commerce Outillage et Équipements'
        });
      }
    } catch (error) {
      console.error('❌ Error fetching company info:', error);
      setCompanyInfo({
        name: 'ETS BENAMAR BOUZID MENOUAR',
        address: '10, Rue Belhandouz A.E.K, Mostaganem',
        phone: '(213)045.42.35.20',
        email: 'outillagesaada@gmail.com',
        nif: '10227010185816600000',
        rc: '21A3965999-27/00',
        art: '100227010185845',
        domaine_activite: 'Commerce Outillage et Équipements'
      });
    }
  };

  // Payment handlers
  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setRefreshPaymentTrigger(prev => prev + 1);
  };

  const handlePaymentChange = () => {
    setRefreshPaymentTrigger(prev => prev + 1);
  };

  const calculateTotalTTC = () => {
    if (!invoice) return 0;
    return parseFloat((invoice.total_ttc || (invoice.montant_ht + invoice.tva)).toString()) || 0;
  };

  if (loading) {    return (
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
            onClick={() => setShowPaymentForm(true)}
            className={styles.primaryButton}
            style={{ marginLeft: '10px', backgroundColor: '#10b981' }}
          >
            💰 Enregistrer un paiement
          </button>
          <button
            onClick={() => router.push(`/returns/new?type=invoice&id=${invoice.nfact}`)}
            className={styles.primaryButton}
            style={{ marginLeft: '10px', backgroundColor: '#e74c3c' }}
          >
            ↩️ Retour / Avoir
          </button>
          <button 
            onClick={() => {
              const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
              window.open(`/pdf/invoice/${invoice.nfact}?tenant=${encodeURIComponent(tenant)}`, '_blank');
            }} 
            className={styles.primaryButton}
            style={{ marginLeft: '10px' }}
          >
            📄 Facture PDF
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div>
          {/* Widget de statut de paiement */}
          {invoice.nfact && (
            <div style={{ marginBottom: '30px' }}>
              <PaymentSummary
                documentType="invoice"
                documentId={invoice.nfact}
                totalAmount={calculateTotalTTC()}
                onViewHistory={() => setShowPaymentHistory(true)}
                refreshTrigger={refreshPaymentTrigger}
              />
            </div>
          )}

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
                  {(invoice.details && invoice.details.length > 0) || ((invoice as any).detail_fact && (invoice as any).detail_fact.length > 0) ? (
                    ((invoice.details || (invoice as any).detail_fact) as InvoiceDetail[]).map((detail, index) => (
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

      {/* Modal de formulaire de paiement */}
      {showPaymentForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <PaymentForm
              documentType="invoice"
              documentId={invoice.nfact}
              documentNumber={invoice.nfact.toString()}
              documentTotalAmount={calculateTotalTTC()}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentForm(false)}
            />
          </div>
        </div>
      )}

      {/* Modal d'historique des paiements */}
      {showPaymentHistory && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', maxWidth: '900px', width: '90%', maxHeight: '90vh', overflow: 'auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Historique des paiements</h2>
              <button onClick={() => setShowPaymentHistory(false)}
                style={{ padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
            <PaymentHistory
              documentType="invoice"
              documentId={invoice.nfact}
              onPaymentChange={handlePaymentChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}