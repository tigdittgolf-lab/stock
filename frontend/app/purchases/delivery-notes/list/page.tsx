'use client';

import { useState, useEffect, useMemo } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from '../../purchases.module.css';

interface PurchaseBL {
  nbl_achat?: number;
  nfournisseur: string;
  numero_bl_fournisseur: string;
  supplier_name: string;
  date_bl: string;
  montant_ht: number;
  tva: number;
  total_ttc: number;
  total_paid?: number;
  payment_status?: 'paid' | 'partial' | 'unpaid';
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  paid:    { label: '✅ Réglé',      color: '#155724', bg: '#d4edda' },
  partial: { label: '⚠️ Partiel',    color: '#856404', bg: '#fff3cd' },
  unpaid:  { label: '❌ Non réglé',  color: '#721c24', bg: '#f8d7da' },
};

export default function PurchaseBLList() {
  const router = useRouter();
  const [bls, setBls] = useState<PurchaseBL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortField, setSortField] = useState<keyof PurchaseBL>('date_bl');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const getTenant = () => {
    const ti = localStorage.getItem('tenant_info');
    if (ti) { try { return JSON.parse(ti).schema || '2009_bu02'; } catch {} }
    return localStorage.getItem('selectedTenant') || '2009_bu02';
  };

  useEffect(() => { fetchBLs(); }, []);

  const fetchBLs = async () => {
    setLoading(true);
    try {
      const tenant = getTenant();
      const headers = { 'X-Tenant': tenant };
      const [blRes, payRes] = await Promise.all([
        fetch(getApiUrl('purchases/delivery-notes'), { headers }),
        fetch(getApiUrl('purchases/payments/summary'), { headers }),
      ]);
      const [blData, payData] = await Promise.all([blRes.json(), payRes.json()]);
      if (blData.success) {
        const payMap: Record<string, number> = payData.success ? (payData.data || {}) : {};
        const list: PurchaseBL[] = (blData.data || []).map((bl: PurchaseBL) => {
          const paid = bl.nbl_achat ? (payMap[`purchase_delivery_note::${bl.nbl_achat}`] || 0) : 0;
          const ttc = bl.total_ttc || bl.montant_ht + bl.tva;
          const status: PurchaseBL['payment_status'] = paid >= ttc - 0.01 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
          return { ...bl, total_paid: paid, payment_status: status };
        });
        setBls(list);
      } else { setError(blData.error || 'Erreur chargement'); }
    } catch { setError('Erreur de connexion'); }
    finally { setLoading(false); }
  };

  const suppliers = useMemo(() =>
    [...new Map(bls.map(b => [b.nfournisseur, b.supplier_name || b.nfournisseur])).entries()], [bls]);

  const filtered = useMemo(() => {
    let r = [...bls];
    if (search) r = r.filter(b =>
      b.numero_bl_fournisseur?.toLowerCase().includes(search.toLowerCase()) ||
      (b.supplier_name || b.nfournisseur)?.toLowerCase().includes(search.toLowerCase())
    );
    if (filterSupplier) r = r.filter(b => b.nfournisseur === filterSupplier);
    if (filterStatus) r = r.filter(b => b.payment_status === filterStatus);
    if (filterDateFrom) r = r.filter(b => b.date_bl >= filterDateFrom);
    if (filterDateTo) r = r.filter(b => b.date_bl <= filterDateTo);
    r.sort((a, b) => {
      const av = a[sortField] ?? '', bv = b[sortField] ?? '';
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return r;
  }, [bls, search, filterSupplier, filterStatus, filterDateFrom, filterDateTo, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const fmt = (n: number) => (n ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const sort = (f: keyof PurchaseBL) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('desc'); }
    setPage(1);
  };
  const SortIcon = ({ f }: { f: keyof PurchaseBL }) =>
    <span style={{ opacity: sortField === f ? 1 : 0.3, marginLeft: 4 }}>{sortField === f ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>;

  const totals = useMemo(() => ({
    ht: filtered.reduce((s, b) => s + (b.montant_ht || 0), 0),
    tva: filtered.reduce((s, b) => s + (b.tva || 0), 0),
    ttc: filtered.reduce((s, b) => s + (b.total_ttc || 0), 0),
    paid: filtered.reduce((s, b) => s + (b.total_paid || 0), 0),
    unpaid: filtered.filter(b => b.payment_status === 'unpaid').length,
    partial: filtered.filter(b => b.payment_status === 'partial').length,
  }), [filtered]);

  if (loading) return (
    <div className={styles.container}>
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)', fontSize: 18 }}>⏳ Chargement...</div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>📋 BL d'Achat</div>
        <div className={styles.headerButtons}>
          <button className={styles.navButton} onClick={() => router.push('/purchases/delivery-notes')}>+ Nouveau BL</button>
          <button className={styles.backButton} onClick={() => router.push('/dashboard')}>← Tableau de bord</button>
        </div>
      </div>

      {/* Filtres */}
      <div className={styles.form} style={{ marginBottom: 20 }}>
        <div className={styles.section} style={{ paddingBottom: 20 }}>
          <div className={styles.sectionTitle}>🔍 Filtres</div>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Recherche</label>
              <input type="text" placeholder="N° BL, fournisseur..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className={styles.formGroup}>
              <label>Fournisseur</label>
              <select value={filterSupplier} onChange={e => { setFilterSupplier(e.target.value); setPage(1); }}>
                <option value="">Tous les fournisseurs</option>
                {suppliers.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Statut paiement</label>
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
                <option value="">Tous les statuts</option>
                <option value="unpaid">❌ Non réglé</option>
                <option value="partial">⚠️ Partiel</option>
                <option value="paid">✅ Réglé</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Du</label>
              <input type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }} />
            </div>
            <div className={styles.formGroup}>
              <label>Au</label>
              <input type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setPage(1); }} />
            </div>
            <div className={styles.formGroup}>
              <label>Par page</label>
              <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}>
                {[10,25,50,100].map(n => <option key={n} value={n}>{n} par page</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && <div className={styles.errorMsg}>❌ {error} <button onClick={fetchBLs} style={{ marginLeft: 10, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>Réessayer</button></div>}

      <div className={styles.form}>
        <div className={styles.section}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => sort('numero_bl_fournisseur')} style={{ cursor: 'pointer' }}>N° BL<SortIcon f="numero_bl_fournisseur" /></th>
                <th onClick={() => sort('supplier_name')} style={{ cursor: 'pointer' }}>Fournisseur<SortIcon f="supplier_name" /></th>
                <th onClick={() => sort('date_bl')} style={{ cursor: 'pointer' }}>Date<SortIcon f="date_bl" /></th>
                <th style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => sort('montant_ht')}>Montant HT<SortIcon f="montant_ht" /></th>
                <th style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => sort('total_ttc')}>Total TTC<SortIcon f="total_ttc" /></th>
                <th style={{ textAlign: 'center' }}>Statut</th>
                <th style={{ textAlign: 'right' }}>Payé</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className={styles.emptyState}>
                  {search || filterSupplier || filterStatus ? 'Aucun résultat pour ces filtres.' : 'Aucun BL d\'achat enregistré.'}
                </td></tr>
              ) : paginated.map(bl => {
                const st = STATUS[bl.payment_status || 'unpaid'];
                const ttc = bl.total_ttc || bl.montant_ht + bl.tva;
                const reste = Math.max(0, ttc - (bl.total_paid || 0));
                return (
                  <tr key={`${bl.numero_bl_fournisseur}-${bl.nfournisseur}`}>
                    <td><strong style={{ color: '#fd7e14' }}>{bl.numero_bl_fournisseur}</strong></td>
                    <td>{bl.supplier_name || bl.nfournisseur}</td>
                    <td>{fmtDate(bl.date_bl)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(bl.montant_ht)} DA</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(ttc)} DA</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: st.color, background: st.bg }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontSize: 13 }}>
                      <div style={{ color: '#155724' }}>{fmt(bl.total_paid || 0)} DA</div>
                      {reste > 0.01 && <div style={{ color: '#721c24', fontSize: 11 }}>Reste: {fmt(reste)} DA</div>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button className={styles.editButton} onClick={() => router.push(`/purchases/delivery-notes/${encodeURIComponent(bl.numero_bl_fournisseur)}/${encodeURIComponent(bl.nfournisseur)}`)}>👁️ Voir</button>
                        <button className={styles.navButton} style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => router.push(`/purchases/delivery-notes/${encodeURIComponent(bl.numero_bl_fournisseur)}/${encodeURIComponent(bl.nfournisseur)}/edit`)}>✏️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 30px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {(page-1)*perPage+1}–{Math.min(page*perPage, filtered.length)} sur {filtered.length} BL{filtered.length > 1 ? 's' : ''}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className={styles.backButton} style={{ padding: '6px 12px' }} disabled={page === 1} onClick={() => setPage(1)}>⏮</button>
              <button className={styles.backButton} style={{ padding: '6px 12px' }} disabled={page === 1} onClick={() => setPage(p => p-1)}>◀</button>
              <span style={{ padding: '6px 16px', background: 'var(--background-secondary)', borderRadius: 6, fontSize: 14 }}>Page {page} / {totalPages}</span>
              <button className={styles.backButton} style={{ padding: '6px 12px' }} disabled={page === totalPages} onClick={() => setPage(p => p+1)}>▶</button>
              <button className={styles.backButton} style={{ padding: '6px 12px' }} disabled={page === totalPages} onClick={() => setPage(totalPages)}>⏭</button>
            </div>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className={styles.totals} style={{ marginTop: 20, borderRadius: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20 }}>
            {[
              { label: 'Total BLs', value: filtered.length, unit: '' },
              { label: 'Total HT', value: fmt(totals.ht), unit: ' DA' },
              { label: 'Total TVA', value: fmt(totals.tva), unit: ' DA' },
              { label: 'Total TTC', value: fmt(totals.ttc), unit: ' DA' },
              { label: 'Total payé', value: fmt(totals.paid), unit: ' DA' },
              { label: 'Reste à payer', value: fmt(totals.ttc - totals.paid), unit: ' DA' },
            ].map(({ label, value, unit }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{value}{unit}</div>
              </div>
            ))}
          </div>
          {(totals.unpaid > 0 || totals.partial > 0) && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.3)', display: 'flex', gap: 20, justifyContent: 'center', fontSize: 14 }}>
              {totals.unpaid > 0 && <span>❌ {totals.unpaid} non réglé{totals.unpaid > 1 ? 's' : ''}</span>}
              {totals.partial > 0 && <span>⚠️ {totals.partial} partiel{totals.partial > 1 ? 's' : ''}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
