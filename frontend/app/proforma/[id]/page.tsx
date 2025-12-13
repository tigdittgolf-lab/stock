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
                <h2 style={{ color: '#17a2b8', fontSize: '1.8rem' }}>FACTURE PROFORMA</h2>
                <p><strong>N° :</strong> {proforma.nfprof}</p>
                <p><strong>Date :</strong> {new Date(proforma.date_fact).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>

          {/* Informations client */}
          <div className={styles.formSection}>
            <h2>Devis pour :</h2>
            <p><strong>Code :</strong> {proforma.nclient}</p>
            <p><strong>Raison sociale :</strong> {proforma.client_name || proforma.nclient}</p>
          </div>

          {/* Détails des articles */}
          <div className={styles.formSection}>
            <h2>Articles proposés :</h2>
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
                  {proforma.details && proforma.details.length > 0 ? (
                    proforma.details.map((detail, index) => (
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
                <span>{proforma.montant_ht?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
              </div>
              <div className={styles.totalRow}>
                <span>TVA :</span>
                <span>{proforma.tva?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
              </div>
              <div className={styles.totalRow}>
                <strong>Total TTC :</strong>
                <strong>{proforma.total_ttc?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className={styles.formSection} style={{ background: '#e7f3ff', borderLeft: '4px solid #17a2b8' }}>
            <h2>Conditions du devis :</h2>
            <ul>
              <li>Ce devis est valable 30 jours à compter de la date d'émission</li>
              <li>Les prix sont exprimés en Dinars Algériens (DA) TTC</li>
              <li>Livraison sous 15 jours ouvrables après confirmation de commande</li>
              <li>Paiement : 50% à la commande, solde à la livraison</li>
            </ul>
          </div>

          {/* Note importante */}
          <div className={styles.formSection} style={{ background: '#fff3cd', borderLeft: '4px solid #ffc107' }}>
            <p><strong>Note :</strong> Cette facture proforma n'a aucune valeur comptable. Elle constitue uniquement une proposition commerciale.</p>
          </div>

          {/* Informations de création */}
          <div className={styles.formSection} style={{ textAlign: 'center', color: '#666' }}>
            <p><small>Devis créé le : {new Date(proforma.created_at).toLocaleString('fr-FR')}</small></p>
          </div>
        </div>
      </main>


    </div>
  );
}