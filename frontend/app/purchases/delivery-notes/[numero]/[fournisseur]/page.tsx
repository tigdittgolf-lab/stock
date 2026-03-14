'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import styles from '../../../../../purchases.module.css';

interface PurchaseBLDetail {
  nbl_achat: number;
  nfournisseur: string;
  numero_bl_fournisseur: string;
  supplier_name: string;
  supplier_address: string;
  supplier_phone: string;
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
  params: Promise<{ numero: string; fournisseur: string }>;
}

export default function PurchaseBLDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const numero = resolvedParams.numero;
  const fournisseur = resolvedParams.fournisseur;

  const [bl, setBl] = useState<PurchaseBLDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (numero && fournisseur) fetchBL();
  }, [numero, fournisseur]);

  const fetchBL = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2009_bu02';
      const response = await fetch(
        getApiUrl(`purchases/delivery-notes/${encodeURIComponent(numero)}/${encodeURIComponent(fournisseur)}`),
        { headers: { 'X-Tenant': tenant } }
      );
      const data = await response.json();
      if (data.success) {
        setBl(data.data);
      } else {
        setError(data.error || 'BL introuvable');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    (n ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtDate = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)', fontSize: 18 }}>
          ⏳ Chargement du BL...
        </div>
      </div>
    );
  }

  if (error || !bl) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMsg} style={{ margin: '40px auto', maxWidth: 500, textAlign: 'center' }}>
          ❌ {error || 'BL introuvable'}
        </div>
        <div style={{ textAlign: 'center' }}>
          <button className={styles.backButton} onClick={() => router.push('/purchases/delivery-notes/list')}>
            ← Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          📋 BL d'Achat
          <span className={styles.docNumber}>
            {bl.numero_bl_fournisseur || `#${bl.nbl_achat}`}
          </span>
        </div>
        <div className={styles.headerButtons}>
          <button
            className={styles.navButton}
            onClick={() => router.push(`/purchases/delivery-notes/${encodeURIComponent(numero)}/${encodeURIComponent(fournisseur)}/edit`)}
          >
            ✏️ Modifier
          </button>
          <button
            className={styles.backButton}
            onClick={() => router.push('/purchases/delivery-notes/list')}
          >
            ← Retour à la liste
          </button>
        </div>
      </div>

      <div className={styles.form}>
        {/* Fournisseur */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>🏭 Informations Fournisseur</div>
          <div className={styles.supplierInfoCard}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              {bl.supplier_name || bl.nfournisseur}
            </div>
            <div style={{ opacity: 0.85, fontSize: 14, marginBottom: 12 }}>
              Code: {bl.nfournisseur}
            </div>
            <div className={styles.supplierInfoGrid}>
              {bl.supplier_address && (
                <div className={styles.supplierInfoItem}>
                  <span className={styles.supplierInfoLabel}>📍 Adresse</span>
                  <span className={styles.supplierInfoValue} style={{ fontSize: 15 }}>
                    {bl.supplier_address}
                  </span>
                </div>
              )}
              {bl.supplier_phone && (
                <div className={styles.supplierInfoItem}>
                  <span className={styles.supplierInfoLabel}>📞 Téléphone</span>
                  <span className={styles.supplierInfoValue} style={{ fontSize: 15 }}>
                    {bl.supplier_phone}
                  </span>
                </div>
              )}
              <div className={styles.supplierInfoItem}>
                <span className={styles.supplierInfoLabel}>📅 Date BL</span>
                <span className={styles.supplierInfoValue}>{fmtDate(bl.date_bl)}</span>
              </div>
              <div className={styles.supplierInfoItem}>
                <span className={styles.supplierInfoLabel}>🗓️ Créé le</span>
                <span className={styles.supplierInfoValue} style={{ fontSize: 14 }}>
                  {fmtDate(bl.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Articles */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>📦 Articles Livrés</div>
          {bl.details && bl.details.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code Article</th>
                  <th>Désignation</th>
                  <th style={{ textAlign: 'right' }}>Quantité</th>
                  <th style={{ textAlign: 'right' }}>Prix Unitaire</th>
                  <th style={{ textAlign: 'right' }}>TVA</th>
                  <th style={{ textAlign: 'right' }}>Total Ligne</th>
                </tr>
              </thead>
              <tbody>
                {bl.details.map((d, i) => (
                  <tr key={i}>
                    <td><strong>{d.narticle}</strong></td>
                    <td>{d.designation || '—'}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(d.qte)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(d.prix)} DA</td>
                    <td style={{ textAlign: 'right' }}>{fmt(d.tva)} %</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(d.total_ligne)} DA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>Aucun article enregistré pour ce BL.</div>
          )}
        </div>

        {/* Totaux */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>💰 Récapitulatif</div>
          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Montant HT</span>
              <span className={styles.totalValue}>{fmt(bl.montant_ht)} DA</span>
            </div>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>TVA</span>
              <span className={styles.totalValue}>{fmt(bl.tva)} DA</span>
            </div>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total TTC</span>
              <span className={styles.totalValue}>{fmt(bl.total_ttc || bl.montant_ht + bl.tva)} DA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
