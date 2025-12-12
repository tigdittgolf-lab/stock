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
              <h3>BON DE LIVRAISON</h3>
              <p><strong>N° :</strong> {deliveryNote.nbl}</p>
              <p><strong>Date :</strong> {new Date(deliveryNote.date_fact).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* Informations client */}
          <div className={styles.clientInfo}>
            <h3>Client :</h3>
            <div className={styles.clientDetails}>
              <p><strong>Code :</strong> {deliveryNote.nclient}</p>
              <p><strong>Raison sociale :</strong> {deliveryNote.client_name || deliveryNote.nclient}</p>
            </div>
          </div>

          {/* Détails des articles */}
          <div className={styles.itemsSection}>
            <h3>Articles livrés :</h3>
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
                {deliveryNote.details && deliveryNote.details.length > 0 ? (
                  deliveryNote.details.map((detail, index) => (
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
                <span>{deliveryNote.montant_ht?.toFixed(2)} DA</span>
              </div>
              <div className={styles.totalRow}>
                <span>TVA :</span>
                <span>{deliveryNote.tva?.toFixed(2)} DA</span>
              </div>
              <div className={styles.totalRow}>
                <strong>Total TTC :</strong>
                <strong>{deliveryNote.total_ttc?.toFixed(2)} DA</strong>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className={styles.signaturesSection}>
            <div className={styles.signatureBox}>
              <h4>Signature du livreur</h4>
              <div className={styles.signatureSpace}></div>
              <p>Date : ___________</p>
            </div>
            <div className={styles.signatureBox}>
              <h4>Signature du client</h4>
              <div className={styles.signatureSpace}></div>
              <p>Date : ___________</p>
            </div>
          </div>

          {/* Informations de création */}
          <div className={styles.metaInfo}>
            <p><small>Document créé le : {new Date(deliveryNote.created_at).toLocaleString('fr-FR')}</small></p>
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

        .signaturesSection {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
          margin-bottom: 30px;
        }

        .signatureBox {
          width: 45%;
          text-align: center;
        }

        .signatureSpace {
          height: 80px;
          border: 1px solid #ddd;
          margin: 15px 0;
        }

        .metaInfo {
          text-align: center;
          color: #666;
          border-top: 1px solid #eee;
          padding-top: 15px;
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