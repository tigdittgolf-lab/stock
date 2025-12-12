'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

interface Proforma {
  nfprof: number;
  nclient: string;
  date_fact: string;
  montant_ht: number;
  tva: number;
  total_ttc: number;
  created_at: string;
  client_name: string;
  details?: ProformaDetail[];
}

interface ProformaDetail {
  narticle: string;
  designation: string;
  qte: number;
  prix: number;
  tva: number;
  total_ligne: number;
}

export default function ProformaDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [proforma, setProforma] = useState<Proforma | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Unwrap params using React.use()
  const resolvedParams = use(params);

  useEffect(() => {
    fetchProforma();
  }, []);

  const fetchProforma = async () => {
    try {
      console.log('🔍 Fetching proforma with params:', resolvedParams);
      console.log('🔍 ID parameter:', resolvedParams.id, 'type:', typeof resolvedParams.id);
      
      if (!resolvedParams.id || resolvedParams.id === 'undefined') {
        setError('ID de facture proforma invalide');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`http://localhost:3005/api/sales/proforma/${resolvedParams.id}`, {
        headers: {
          'X-Tenant': '2025_bu01'
        }
      });
      
      if (response.status === 404) {
        setError('Facture proforma non trouvée');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setProforma(data.data);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Error fetching proforma:', error);
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
          <button onClick={() => router.push('/proforma/list')} className={styles.secondaryButton}>
            Retour à la liste
          </button>
        </header>
        <main className={styles.main}>
          <div className={styles.error}>
            <h2>❌ {error}</h2>
            <p>La facture proforma demandée n'a pas pu être chargée.</p>
            <button 
              onClick={() => router.push('/proforma/list')} 
              className={styles.primaryButton}
            >
              Retour à la liste
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!proforma) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Facture proforma non trouvée</h1>
          <button onClick={() => router.push('/proforma/list')} className={styles.secondaryButton}>
            Retour à la liste
          </button>
        </header>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Facture Proforma N° {proforma.nfprof}</h1>
        <div>
          <button onClick={() => router.push('/proforma/list')} className={styles.secondaryButton}>
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
              <h3>FACTURE PROFORMA</h3>
              <p><strong>N° :</strong> {proforma.nfprof}</p>
              <p><strong>Date :</strong> {new Date(proforma.date_fact).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* Informations client */}
          <div className={styles.clientInfo}>
            <h3>Devis pour :</h3>
            <div className={styles.clientDetails}>
              <p><strong>Code :</strong> {proforma.nclient}</p>
              <p><strong>Raison sociale :</strong> {proforma.client_name || proforma.nclient}</p>
            </div>
          </div>

          {/* Détails des articles */}
          <div className={styles.itemsSection}>
            <h3>Articles proposés :</h3>
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
                {proforma.details && proforma.details.length > 0 ? (
                  proforma.details.map((detail, index) => (
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
                <span>{proforma.montant_ht?.toFixed(2)} DA</span>
              </div>
              <div className={styles.totalRow}>
                <span>TVA :</span>
                <span>{proforma.tva?.toFixed(2)} DA</span>
              </div>
              <div className={styles.totalRow}>
                <strong>Total TTC :</strong>
                <strong>{proforma.total_ttc?.toFixed(2)} DA</strong>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className={styles.conditionsSection}>
            <h4>Conditions du devis :</h4>
            <ul>
              <li>Ce devis est valable 30 jours à compter de la date d'émission</li>
              <li>Les prix sont exprimés en Dinars Algériens (DA) TTC</li>
              <li>Livraison sous 15 jours ouvrables après confirmation de commande</li>
              <li>Paiement : 50% à la commande, solde à la livraison</li>
            </ul>
          </div>

          {/* Note importante */}
          <div className={styles.noteSection}>
            <p><strong>Note :</strong> Cette facture proforma n'a aucune valeur comptable. Elle constitue uniquement une proposition commerciale.</p>
          </div>

          {/* Informations de création */}
          <div className={styles.metaInfo}>
            <p><small>Devis créé le : {new Date(proforma.created_at).toLocaleString('fr-FR')}</small></p>
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
          color: #17a2b8;
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
          border-bottom: 2px solid #17a2b8;
          font-size: 18px;
          margin-top: 10px;
          padding-top: 10px;
        }

        .conditionsSection {
          margin-top: 40px;
          padding: 15px;
          background: #e7f3ff;
          border-radius: 5px;
          border-left: 4px solid #17a2b8;
        }

        .conditionsSection h4 {
          margin-bottom: 15px;
          color: #333;
        }

        .conditionsSection ul {
          margin: 0;
          padding-left: 20px;
        }

        .conditionsSection li {
          margin-bottom: 8px;
        }

        .noteSection {
          margin-top: 20px;
          padding: 15px;
          background: #fff3cd;
          border-radius: 5px;
          border-left: 4px solid #ffc107;
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