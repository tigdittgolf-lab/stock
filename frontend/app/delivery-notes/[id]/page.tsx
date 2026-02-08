'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';
import PaymentSummary from '@/components/payments/PaymentSummary';
import PaymentForm from '@/components/payments/PaymentForm';
import PaymentHistory from '@/components/payments/PaymentHistory';

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface DeliveryNote {
  nbl: number;
  nclient: string;
  date_fact: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  created_at: string;
  client_name: string;
  details?: DeliveryNoteDetail[];
}

interface DeliveryNoteDetail {
  narticle: string;
  designation: string;
  qte: number;
  prix: number;
  tva: number;
  total_ligne: number;
}

export default function DeliveryNoteDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [deliveryNote, setDeliveryNote] = useState<DeliveryNote | null>(null);
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
    fetchDeliveryNote();
    fetchCompanyInfo();
  }, []);

  const fetchDeliveryNote = async () => {
    try {
      console.log('🔍 Fetching delivery note with params:', resolvedParams);
      console.log('🔍 ID parameter:', resolvedParams.id, 'type:', typeof resolvedParams.id);
      
      if (!resolvedParams.id || resolvedParams.id === 'undefined') {
        setError('ID de bon de livraison invalide');
        setLoading(false);
        return;
      }
      
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch(`/api/sales/delivery-notes/${resolvedParams.id}`, {
        headers: {
          'X-Tenant': tenant
        }
      });
      
      if (response.status === 404) {
        setError('Bon de livraison non trouvé');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setDeliveryNote(data.data);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Error fetching delivery note:', error);
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
          const activity = data.data[0]; // Prendre la première activité
          setCompanyInfo({
            name: activity.nom_entreprise || 'VOTRE ENTREPRISE',
            address: activity.adresse || 'Adresse de votre entreprise',
            phone: activity.telephone || '+213 XX XX XX XX',
            email: activity.email || 'contact@entreprise.dz'
          });
          console.log('✅ Company info set:', {
            name: activity.nom_entreprise,
            address: activity.adresse,
            phone: activity.telephone,
            email: activity.email
          });
        } else {
          console.warn('⚠️ No company data found, using defaults');
          setCompanyInfo({
            name: 'VOTRE ENTREPRISE',
            address: 'Adresse de votre entreprise',
            phone: '+213 XX XX XX XX',
            email: 'contact@entreprise.dz'
          });
        }
      } else {
        console.warn('⚠️ Could not fetch company info, using defaults');
        setCompanyInfo({
          name: 'VOTRE ENTREPRISE',
          address: 'Adresse de votre entreprise',
          phone: '+213 XX XX XX XX',
          email: 'contact@entreprise.dz'
        });
      }
    } catch (error) {
      console.error('❌ Error fetching company info:', error);
      setCompanyInfo({
        name: 'VOTRE ENTREPRISE',
        address: 'Adresse de votre entreprise',
        phone: '+213 XX XX XX XX',
        email: 'contact@entreprise.dz'
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
    if (!deliveryNote) return 0;
    
    let totalTTC = deliveryNote.montant_ttc;
    if (totalTTC === undefined || totalTTC === null || isNaN(totalTTC)) {
      const montantHT = parseFloat(deliveryNote.montant_ht?.toString() || '0') || 0;
      const tva = parseFloat(deliveryNote.tva?.toString() || '0') || 0;
      totalTTC = montantHT + tva;
    } else {
      totalTTC = parseFloat(totalTTC.toString()) || 0;
    }
    return totalTTC;
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
          <button onClick={() => router.push('/delivery-notes/list')} className={styles.secondaryButton}>
            Retour à la liste
          </button>
        </header>
        <main className={styles.main}>
          <div className={styles.error}>
            <h2>❌ {error}</h2>
            <p>Le bon de livraison demandé n'a pas pu être chargé.</p>
            <button 
              onClick={() => router.push('/delivery-notes/list')} 
              className={styles.primaryButton}
            >
              Retour à la liste
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!deliveryNote) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Bon de livraison non trouvé</h1>
          <button onClick={() => router.push('/delivery-notes/list')} className={styles.secondaryButton}>
            Retour à la liste
          </button>
        </header>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Bon de Livraison N° {deliveryNote.nbl}</h1>
        <div>
          <button onClick={() => router.push('/delivery-notes/list')} className={styles.secondaryButton}>
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
            onClick={() => {
              const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
              const url = `/api/pdf/delivery-note/${deliveryNote.nbl}`;
              
              fetch(url, {
                headers: {
                  'X-Tenant': tenant
                }
              })
              .then(response => response.blob())
              .then(blob => {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
              })
              .catch(error => {
                console.error('Erreur PDF:', error);
                alert('Erreur lors de la génération du PDF');
              });
            }}
            className={styles.primaryButton}
            style={{ marginLeft: '10px' }}
          >
            📄 BL Complet
          </button>
          <button 
            onClick={() => {
              const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
              const url = `/api/pdf/delivery-note-small/${deliveryNote.nbl}`;
              
              fetch(url, {
                headers: {
                  'X-Tenant': tenant
                }
              })
              .then(response => response.blob())
              .then(blob => {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
              })
              .catch(error => {
                console.error('Erreur PDF:', error);
                alert('Erreur lors de la génération du PDF');
              });
            }}
            className={styles.primaryButton}
            style={{ marginLeft: '10px' }}
          >
            📄 BL Réduit
          </button>
          <button 
            onClick={() => {
              const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
              const url = `/api/pdf/delivery-note-ticket/${deliveryNote.nbl}`;
              
              fetch(url, {
                headers: {
                  'X-Tenant': tenant
                }
              })
              .then(response => response.blob())
              .then(blob => {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
              })
              .catch(error => {
                console.error('Erreur PDF:', error);
                alert('Erreur lors de la génération du PDF');
              });
            }}
            className={styles.primaryButton}
            style={{ marginLeft: '10px' }}
          >
            🎫 Ticket
          </button>
          <button 
            onClick={() => window.print()} 
            className={styles.primaryButton}
            style={{ marginLeft: '10px' }}
          >
            🖨️ Imprimer
          </button>
          <button 
            onClick={() => router.push(`/delivery-notes/${resolvedParams.id}/edit`)} 
            className={styles.primaryButton}
            style={{ marginLeft: '10px' }}
          >
            ✏️ Modifier
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div>
          {/* Widget de statut de paiement */}
          <div style={{ marginBottom: '30px' }}>
            <PaymentSummary
              documentType="delivery_note"
              documentId={deliveryNote.nbl}
              totalAmount={calculateTotalTTC()}
              onViewHistory={() => setShowPaymentHistory(true)}
              refreshTrigger={refreshPaymentTrigger}
            />
          </div>

          {/* En-tête du document */}
          <div className={styles.formSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2>{companyInfo?.name || 'VOTRE ENTREPRISE'}</h2>
                <p>{companyInfo?.address || 'Adresse de votre entreprise'}</p>
                <p>Téléphone : {companyInfo?.phone || '+213 XX XX XX XX'}</p>
                <p>Email : {companyInfo?.email || 'contact@entreprise.dz'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ color: '#007bff', fontSize: '1.8rem' }}>BON DE LIVRAISON</h2>
                <p><strong>N° :</strong> {deliveryNote.nbl}</p>
                <p><strong>Date :</strong> {new Date(deliveryNote.date_fact).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>

          {/* Informations client */}
          <div className={styles.formSection}>
            <h2>Client :</h2>
            <p><strong>Code :</strong> {deliveryNote.nclient}</p>
            <p><strong>Raison sociale :</strong> {deliveryNote.client_name || deliveryNote.nclient}</p>
          </div>

          {/* Détails des articles */}
          <div className={styles.formSection}>
            <h2>Articles livrés :</h2>
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
                  {deliveryNote.details && deliveryNote.details.length > 0 ? (
                    deliveryNote.details.map((detail, index) => (
                      <tr key={index}>
                        <td>{detail.narticle}</td>
                        <td>{detail.designation}</td>
                        <td style={{ textAlign: 'right' }}>{Math.round(detail.qte).toLocaleString('fr-FR')}</td>
                        <td style={{ textAlign: 'right' }}>{parseFloat(detail.prix.toString()).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</td>
                        <td style={{ textAlign: 'right' }}>{parseFloat(detail.tva.toString()).toFixed(0)}%</td>
                        <td style={{ textAlign: 'right' }}>{parseFloat(detail.total_ligne.toString()).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</td>
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
                <span>{parseFloat(deliveryNote.montant_ht?.toString() || '0').toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
              </div>
              <div className={styles.totalRow}>
                <span>TVA :</span>
                <span>{parseFloat(deliveryNote.tva?.toString() || '0').toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
              </div>
              <div className={styles.totalRow}>
                <strong>Total TTC :</strong>
                <strong>
                  {(() => {
                    // Calcul automatique du Total TTC si non défini
                    let totalTTC = deliveryNote.montant_ttc;
                    if (totalTTC === undefined || totalTTC === null || isNaN(totalTTC)) {
                      // Convertir en nombres pour éviter la concaténation de chaînes
                      const montantHT = parseFloat(deliveryNote.montant_ht?.toString() || '0') || 0;
                      const tva = parseFloat(deliveryNote.tva?.toString() || '0') || 0;
                      totalTTC = montantHT + tva;
                    } else {
                      // S'assurer que totalTTC est un nombre
                      totalTTC = parseFloat(totalTTC.toString()) || 0;
                    }
                    return totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  })()} DA
                </strong>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className={styles.formSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: '45%', textAlign: 'center' }}>
                <h3>Signature du livreur</h3>
                <div style={{ height: '80px', border: '1px solid #ddd', margin: '15px 0' }}></div>
                <p>Date : ___________</p>
              </div>
              <div style={{ width: '45%', textAlign: 'center' }}>
                <h3>Signature du client</h3>
                <div style={{ height: '80px', border: '1px solid #ddd', margin: '15px 0' }}></div>
                <p>Date : ___________</p>
              </div>
            </div>
          </div>

          {/* Informations de création */}
          <div className={styles.formSection} style={{ textAlign: 'center', color: '#666' }}>
            <p><small>Document créé le : {new Date(deliveryNote.created_at).toLocaleString('fr-FR')}</small></p>
          </div>
        </div>
      </main>

      {/* Modal de formulaire de paiement */}
      {showPaymentForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <PaymentForm
              documentType="delivery_note"
              documentId={deliveryNote.nbl}
              documentNumber={deliveryNote.nbl.toString()}
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
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '900px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Historique des paiements</h2>
              <button
                onClick={() => setShowPaymentHistory(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Fermer
              </button>
            </div>
            <PaymentHistory
              documentType="delivery_note"
              documentId={deliveryNote.nbl}
              onPaymentChange={handlePaymentChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}