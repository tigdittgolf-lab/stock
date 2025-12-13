'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

interface DeliveryNote {
  nbl: number;
  nclient: string;
  date_fact: string;
  montant_ht: number;
  tva: number;
  total_ttc: number;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Unwrap params using React.use()
  const resolvedParams = use(params);

  useEffect(() => {
    fetchDeliveryNote();
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
      
      const response = await fetch(`http://localhost:3005/api/sales/delivery-notes/${resolvedParams.id}`, {
        headers: {
          'X-Tenant': '2025_bu01'
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
            onClick={() => {
              const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
              const url = `http://localhost:3005/api/pdf/delivery-note/${deliveryNote.nbl}`;
              
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
              const url = `http://localhost:3005/api/pdf/delivery-note-small/${deliveryNote.nbl}`;
              
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
              const url = `http://localhost:3005/api/pdf/delivery-note-ticket/${deliveryNote.nbl}`;
              
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
        </div>
      </header>

      <main className={styles.main}>
        <div>
          {/* En-tête du document */}
          <div className={styles.formSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2>VOTRE ENTREPRISE</h2>
                <p>Adresse de votre entreprise</p>
                <p>Téléphone : +213 XX XX XX XX</p>
                <p>Email : contact@entreprise.dz</p>
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
                <span>{deliveryNote.montant_ht?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
              </div>
              <div className={styles.totalRow}>
                <span>TVA :</span>
                <span>{deliveryNote.tva?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
              </div>
              <div className={styles.totalRow}>
                <strong>Total TTC :</strong>
                <strong>{deliveryNote.total_ttc?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong>
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


    </div>
  );
}