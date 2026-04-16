'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import styles from '../../../purchases.module.css';

interface SupplierFull {
  nfournisseur: string;
  nom_fournisseur: string;
  resp_fournisseur?: string;
  adresse_fourni?: string;
  tel?: string; tel1?: string; tel2?: string;
  email?: string;
  caf?: number;   // CA Factures achat
  cabl?: number;  // CA BL achat
  commentaire?: string;
}

interface PurchaseBLDetail {
  nbl_achat: number;
  nfact: string;
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

const fmt = (n: number) => (Math.round((n || 0) * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function PurchaseBLDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const numero = resolvedParams.numero;
  const fournisseur = resolvedParams.fournisseur;

  const [bl, setBl] = useState<PurchaseBLDetail | null>(null);
  const [supplier, setSupplier] = useState<SupplierFull | null>(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (numero && fournisseur) fetchAll();
  }, [numero, fournisseur]);

  const fetchAll = async () => {
    const tenant = localStorage.getItem('selectedTenant') || '2009_bu02';
    const dbConfig = localStorage.getItem('activeDbConfig');
    const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
    const headers = { 'X-Tenant': tenant, 'X-Database-Type': dbType };

    try {
      // Load BL + suppliers + payments in parallel
      const [blRes, suppRes, payRes] = await Promise.all([
        fetch(getApiUrl(`purchases/delivery-notes/${encodeURIComponent(numero)}/${encodeURIComponent(fournisseur)}`), { headers }),
        fetch('/api/sales/suppliers', { headers }),
        fetch(getApiUrl('purchases/payments/summary'), { headers }),
      ]);

      const [blData, suppData, payData] = await Promise.all([
        blRes.json(), suppRes.json(), payRes.json()
      ]);

      if (!blData.success) { setError(blData.error || 'BL introuvable'); return; }

      const blRaw = blData.data;

      // Find full supplier data
      if (suppData.success && suppData.data) {
        const found = suppData.data.find((s: any) =>
          String(s.nfournisseur || s.Nfournisseur || '').trim().toLowerCase() ===
          String(blRaw.nfournisseur || fournisseur || '').trim().toLowerCase()
        );
        if (found) {
          const fv = (...keys: string[]) => {
            for (const k of keys) {
              const rk = Object.keys(found).find(ok => ok.toLowerCase() === k.toLowerCase());
              if (rk && found[rk] != null) return found[rk];
            }
            return undefined;
          };
          setSupplier({
            nfournisseur: fv('nfournisseur') || '',
            nom_fournisseur: fv('nom_fournisseur') || fv('nfournisseur') || '',
            resp_fournisseur: fv('resp_fournisseur') || '',
            adresse_fourni: fv('adresse_fourni', 'adresse') || '',
            tel: fv('tel', 'telephone') || '',
            tel1: fv('tel1') || '',
            tel2: fv('tel2') || '',
            email: fv('email') || '',
            caf: parseFloat(fv('caf', 'CAF') || 0),
            cabl: parseFloat(fv('cabl', 'CABL') || 0),
            commentaire: fv('commentaire') || '',
          });
          // Enrich BL with supplier info
          blRaw.supplier_name = fv('nom_fournisseur') || blRaw.nfournisseur;
          blRaw.supplier_address = fv('adresse_fourni', 'adresse') || '';
          blRaw.supplier_phone = fv('tel', 'telephone') || '';
        }
      }

      // Calculate total paid for this BL
      if (payData.success && payData.data) {
        const key = `purchase_delivery_note::${blRaw.nfact || blRaw.nbl_achat || numero}`;
        setTotalPaid(payData.data[key] || 0);
      }

      setBl(blRaw);
    } catch (e: any) {
      setError('Erreur de connexion: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className={styles.container}>
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)', fontSize: 18 }}>⏳ Chargement...</div>
    </div>
  );

  if (error || !bl) return (
    <div className={styles.container}>
      <div className={styles.errorMsg} style={{ margin: '40px auto', maxWidth: 500, textAlign: 'center' }}>❌ {error || 'BL introuvable'}</div>
      <div style={{ textAlign: 'center' }}>
        <button className={styles.backButton} onClick={() => router.push('/purchases/delivery-notes/list')}>← Retour à la liste</button>
      </div>
    </div>
  );

  const ttc = bl.total_ttc || bl.montant_ht + bl.tva;
  const reste = Math.max(0, ttc - totalPaid);
  const paymentStatus = totalPaid >= ttc - 0.01 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
  const statusConfig = {
    paid:    { label: '✅ Réglé',      color: '#155724', bg: 'var(--success-bg)', border: 'var(--success-border)' },
    partial: { label: '⚠️ Partiel',    color: '#856404', bg: 'var(--warning-bg)', border: 'var(--warning-border)' },
    unpaid:  { label: '❌ Non réglé',  color: '#721c24', bg: 'var(--error-bg)',   border: 'var(--error-border)' },
  }[paymentStatus];

  const caTotal = (supplier?.caf || 0) + (supplier?.cabl || 0);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          📋 BL d'Achat
          <span className={styles.docNumber}>{bl.nfact || bl.numero_bl_fournisseur || numero}</span>
        </div>
        <div className={styles.headerButtons}>
          <button className={styles.navButton}
            onClick={() => router.push(`/purchases/delivery-notes/${encodeURIComponent(numero)}/${encodeURIComponent(fournisseur)}/edit`)}>
            ✏️ Modifier
          </button>
          <button className={styles.backButton} onClick={() => router.push('/purchases/delivery-notes/list')}>
            ← Retour à la liste
          </button>
        </div>
      </div>

      <div className={styles.form}>

        {/* ── FOURNISSEUR + STATS ── */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>🏭 Fournisseur</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Infos identité */}
            <div style={{ background: 'var(--background-secondary)', borderRadius: 12, padding: 20, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                {supplier?.nom_fournisseur || bl.supplier_name || bl.nfournisseur}
              </div>
              {supplier?.resp_fournisseur && (
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12 }}>
                  Contact: {supplier.resp_fournisseur}
                </div>
              )}
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ opacity: 0.6, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Code</span>
                  <strong style={{ color: 'var(--primary-color)' }}>{bl.nfournisseur}</strong>
                </div>
                {(supplier?.adresse_fourni || bl.supplier_address) && (
                  <div>📍 {supplier?.adresse_fourni || bl.supplier_address}</div>
                )}
                {(supplier?.tel || bl.supplier_phone) && (
                  <div>📞 {supplier?.tel || bl.supplier_phone}
                    {supplier?.tel1 && <span style={{ marginLeft: 8, color: 'var(--text-tertiary)' }}>{supplier.tel1}</span>}
                  </div>
                )}
                {supplier?.email && <div>✉️ {supplier.email}</div>}
              </div>
            </div>

            {/* Stats CA + Dettes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* CA */}
              <div style={{ background: 'var(--background-secondary)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-tertiary)', marginBottom: 10 }}>
                  📊 Chiffre d'Affaires
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'CA Factures', val: supplier?.caf || 0, color: '#28a745' },
                    { label: 'CA BL Achat', val: supplier?.cabl || 0, color: '#17a2b8' },
                    { label: 'CA Total', val: caTotal, color: 'var(--primary-color)', bold: true },
                  ].map((item, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--card-background)', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 14, fontWeight: item.bold ? 800 : 700, color: item.color }}>
                        {fmt(item.val)} DA
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statut paiement ce BL */}
              <div style={{ background: statusConfig.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${statusConfig.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-tertiary)', marginBottom: 10 }}>
                  💳 Paiement ce BL
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Total BL', val: ttc, color: 'var(--text-primary)' },
                    { label: 'Payé', val: totalPaid, color: '#28a745' },
                    { label: 'Reste', val: reste, color: reste > 0 ? '#dc3545' : '#28a745' },
                  ].map((item, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--card-background)', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{fmt(item.val)} DA</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, textAlign: 'center', fontWeight: 700, color: statusConfig.color, fontSize: 14 }}>
                  {statusConfig.label}
                </div>
              </div>

              {/* Commentaire fournisseur */}
              {supplier?.commentaire && (
                <div style={{ background: 'var(--warning-bg)', borderRadius: 10, padding: '12px 16px', border: '1px solid var(--warning-border)', fontSize: 13, color: 'var(--warning-text)' }}>
                  💬 {supplier.commentaire}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── DATE BL ── */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>📅 Informations du BL</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {[
              { label: 'N° BL', val: bl.nfact || bl.numero_bl_fournisseur || numero },
              { label: 'Date BL', val: fmtDate(bl.date_bl) },
              { label: 'Fournisseur', val: bl.nfournisseur },
              { label: 'Créé le', val: fmtDate(bl.created_at) },
            ].map((item, i) => (
              <div key={i} style={{ padding: '12px 14px', background: 'var(--background-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{item.val || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── ARTICLES ── */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>📦 Articles Livrés</div>
          {bl.details && bl.details.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
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
                      <td><strong style={{ color: 'var(--primary-color)' }}>{d.narticle}</strong></td>
                      <td>{d.designation || '—'}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(d.qte)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(d.prix)} DA</td>
                      <td style={{ textAlign: 'right' }}>{fmt(d.tva)} %</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(d.total_ligne)} DA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>Aucun article enregistré pour ce BL.</div>
          )}
        </div>

        {/* ── TOTAUX ── */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>💰 Récapitulatif</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ minWidth: 300, background: 'var(--card-background)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              {[
                { label: 'Montant HT', val: bl.montant_ht },
                { label: 'TVA', val: bl.tva },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(r.val)} DA</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', background: 'var(--primary-color)' }}>
                <span style={{ color: 'white', fontWeight: 700 }}>Total TTC</span>
                <span style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>{fmt(ttc)} DA</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}


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
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
      const response = await fetch(
        getApiUrl(`purchases/delivery-notes/${encodeURIComponent(numero)}/${encodeURIComponent(fournisseur)}`),
        { headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType } }
      );
      const data = await response.json();
      if (data.success) {
        const bl = data.data;
        // If supplier_name is missing or same as code, fetch from suppliers list
        if (!bl.supplier_name || bl.supplier_name === bl.nfournisseur) {
          try {
            const suppRes = await fetch('/api/sales/suppliers', {
              headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType }
            });
            const suppData = await suppRes.json();
            if (suppData.success && suppData.data) {
              const found = suppData.data.find((s: any) =>
                String(s.nfournisseur || s.Nfournisseur || '').trim().toLowerCase() ===
                String(bl.nfournisseur || '').trim().toLowerCase()
              );
              if (found) {
                bl.supplier_name = found.nom_fournisseur || found.Nom_fournisseur || bl.nfournisseur;
                bl.supplier_address = found.adresse_fourni || found.adresse || '';
                bl.supplier_phone = found.tel || found.telephone || '';
              }
            }
          } catch { /* non critique */ }
        }
        setBl(bl);
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
            {bl.nfact || bl.numero_bl_fournisseur || (bl.nbl_achat ? `#${bl.nbl_achat}` : `${numero}`)}
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
