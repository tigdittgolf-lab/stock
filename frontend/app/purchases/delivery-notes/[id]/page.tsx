'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import styles from '../../../page.module.css';

interface PurchaseBLDetail {
  nbl_achat: number;
  nfournisseur: string;
  numero_bl_fournisseur: string;
  supplier_name: string;
  supplier_address: string;
  date_bl: string;
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

export default function PurchaseBLDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const blId = resolvedParams.id;
  
  const [bl, setBl] = useState<PurchaseBLDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (blId) {
      fetchBL();
    }
  }, [blId]);

  const fetchBL = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch(`http://localhost:3005/api/purchases/delivery-notes/${blId}`, {
        headers: {
          'X-Tenant': tenant
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setBl(data.data);
      } else {
        setError(data.error || 'BL d\'achat non trouvé');
      }
    } catch (error) {
      console.error('Error fetching purchase BL:', error);
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

  if (error || !bl) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <h2>❌ Erreur</h2>
          <p>{error}</p>
          <button onClick={() => router.push('/purchases/delivery-notes/list')} className={styles.primaryButton}>
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>BL d'Achat - {bl.numero_bl_fournisseur || `ID-${bl.nbl_achat}`}</h1>
        <div>
          <button 
            onClick={() => router.push(`/purchases/delivery-notes/${bl.nbl_achat}/edit`)}
            className={styles.primaryButton}
          >
            Modifier
          </button>
          <button onClick={() => router.push('/purchases/delivery-notes/list')} className={styles.secondaryButton}>
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
              <label>N° BL Fournisseur :</label>
              <span>{bl.numero_bl_fournisseur || 'Non spécifié'}</span>
            </div>
            <div className={styles.invoiceField}>
              <label>ID Interne :</label>
              <span>{bl.nbl_achat}</span>
            </div>
            <div className={styles.invoiceField}>
              <label>Fournisseur :</label>
              <span>{bl.supplier_name || bl.nfournisseur}</span>
            </div>
            <div className={styles.invoiceField}>
              <label>Date de BL :</label>
              <span>{new Date(bl.date_bl).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className={styles.invoiceField}>
              <label>Adresse Fournisseur :</label>
              <span>{bl.supplier_address || 'Non spécifiée'}</span>
            </div>
            <div className={styles.invoiceField}>
              <label>Date de Création :</label>
              <span>{new Date(bl.created_at).toLocaleDateString('fr-FR')} à {new Date(bl.created_at).toLocaleTimeString('fr-FR')}</span>
            </div>
          </div>
        </div>

        {/* Détails des articles */}
        <div className={styles.invoiceSection}>
          <h2>Articles Livrés</h2>
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
                {bl.details?.map((detail, index) => (
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
              <span>{formatNumber(bl.montant_ht)} DA</span>
            </div>
            <div className={styles.totalRow}>
              <span>TVA :</span>
              <span>{formatNumber(bl.tva)} DA</span>
            </div>
            <div className={styles.totalRow}>
              <strong>Total TTC :</strong>
              <strong>{formatNumber(bl.total_ttc)} DA</strong>
            </div>
          </div>
        </div>

        {/* Informations sur les stocks */}
        <div className={styles.invoiceSection}>
          <div className={styles.stockInfo}>
            <h3>📦 Impact sur les Stocks</h3>
            <p>Ce BL d'achat a généré une <strong>entrée de stock BL</strong> pour tous les articles listés.</p>
            <p>Les quantités ont été ajoutées au stock BL (stock_bl) de chaque article.</p>
            <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#2e7d32' }}>
                💡 <strong>Différence avec les factures :</strong> Les BL affectent le stock_bl, les factures affectent le stock_f
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}