'use client';

import { useState, useEffect, useMemo } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from '../../purchases.module.css';

interface PurchaseInvoice {
  nfact_achat: number;
  nfournisseur: string;
  numero_facture_fournisseur: string;
  supplier_name: string;
  date_fact: string;
  montant_ht: number;
  tva: number;
  total_ttc: number;
  total_paid?: number;
  payment_status?: 'paid' | 'partial' | 'unpaid';
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  paid:    { label: '✅ Réglée',     color: '#155724', bg: '#d4edda' },
  partial: { label: '⚠️ Partielle',  color: '#856404', bg: '#fff3cd' },
  unpaid:  { label: '❌ Non réglée', color: '#721c24', bg: '#f8d7da' },
};

export default function PurchaseInvoicesList() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortField, setSortField] = useState<keyof PurchaseInvoice>('date_fact');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const getTenant = () => {
    const ti = localStorage.getItem('tenant_info');
    if (ti) { try { return JSON.parse(ti).schema || '2009_bu02'; } catch {} }
    return localStorage.getItem('selectedTenant') || '2009_bu02';
  };

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const tenant = getTenant();
      const headers = { 'X-Tenant': tenant };

      // Charger factures + résumé paiements en parallèle (2 requêtes au lieu de N)
      const [invRes, payRes] = await Promise.all([
        fetch(getApiUrl('purchases/invoices'), { headers }),
        fetch(getApiUrl('purchases/payments/summary'), { headers }),
      ]);
      const [invData, payData] = await Promise.all([invRes.json(), payRes.json()]);

      if (invData.success) {
        const payMap: Record<string, number> = payData.success ? (payData.data || {}) : {};
        const list: PurchaseInvoice[] = (invData.data || []).map((inv: PurchaseInvoice) => {
          const paid = payMap[`purchase_invoice::${inv.nfact_achat}`] || 0;
          const ttc = inv.total_ttc || inv.montant_ht + inv.tva;
          const status: PurchaseInvoice['payment_status'] = paid >= ttc - 0.01 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
          return { ...inv, total_paid: paid, payment_status: status };
        });
        setInvoices(list);
      } else { setError(invData.error || 'Erreur chargement'); }
    } catch { setError('Erreur de connexion'); }
    finally { setLoading(false); }
  };

  const suppliers = useMemo(() =>
    [...new Map(invoices.map(i => [i.nfournisseur, i.supplier_name || i.nfournisseur])).entries()], [invoices]);

  const filtered = useMemo(() => {
    let r = [...invoices];
    if (search) r = r.filter(i =>
      i.numero_facture_fournisseur?.toLowerCase().includes(search.toLowerCase()) ||
      (i.supplier_name || i.nfournisseur)?.toLowerCase().includes(search.toLowerCase())
    );
    if (filterSupplier) r = r.filter(i => i.nfournisseur === filterSupplier);
    if (filterStatus) r = r.filter(i =>
      filterStatus === 'indebted'
        ? i.payment_status === 'partial' || i.payment_status === 'unpaid'
        : i.payment_status === filterStatus
    );
    if (filterDateFrom) r = r.filter(i => i.date_fact >= filterDateFrom);
    if (filterDateTo) r = r.filter(i => i.date_fact <= filterDateTo);
    r.sort((a, b) => {
      const av = a[sortField] ?? '', bv = b[sortField] ?? '';
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return r;
  }, [invoices, search, filterSupplier, filterStatus, filterDateFrom, filterDateTo, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const fmt = (n: number) => (n ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const sort = (f: keyof PurchaseInvoice) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('desc'); }
    setPage(1);
  };
  const SortIcon = ({ f }: { f: keyof PurchaseInvoice }) =>
    <span style={{ opacity: sortField === f ? 1 : 0.3, marginLeft: 4 }}>{sortField === f ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>;

  const totals = useMemo(() => ({
    ht: filtered.reduce((s, i) => s + (i.montant_ht || 0), 0),
    tva: filtered.reduce((s, i) => s + (i.tva || 0), 0),
    ttc: filtered.reduce((s, i) => s + (i.total_ttc || 0), 0),
    paid: filtered.reduce((s, i) => s + (i.total_paid || 0), 0),
    unpaid: filtered.filter(i => i.payment_status === 'unpaid').length,
    partial: filtered.filter(i => i.payment_status === 'partial').length,
  }), [filtered]);

  if (loading) return (
    <div className={styles.container}>
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)', fontSize: 18 }}>⏳ Chargement...</div>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>🧾 Factures d'Achat</div>
        <div className={styles.headerButtons}>
          <button className={styles.navButton} onClick={() => router.push('/purchases')}>+ Nouvelle Facture</button>
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
              <input type="text" placeholder="N° facture, fournisseur..." value={search}
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
                <option value="unpaid">❌ Non réglée</option>
                <option value="partial">⚠️ Partielle</option>
                <option value="indebted">🔴 En souffrance (partielle + non réglée)</option>
                <option value="paid">✅ Réglée</option>
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

      {error && <div className={styles.errorMsg}>❌ {error} <button onClick={fetchInvoices} style={{ marginLeft: 10, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>Réessayer</button></div>}

      {/* Tableau */}
      <div className={styles.form}>
        <div className={styles.section}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => sort('numero_facture_fournisseur')} style={{ cursor: 'pointer' }}>N° Facture<SortIcon f="numero_facture_fournisseur" /></th>
                <th onClick={() => sort('supplier_name')} style={{ cursor: 'pointer' }}>Fournisseur<SortIcon f="supplier_name" /></th>
                <th onClick={() => sort('date_fact')} style={{ cursor: 'pointer' }}>Date<SortIcon f="date_fact" /></th>
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
                  {search || filterSupplier || filterStatus ? 'Aucun résultat pour ces filtres.' : 'Aucune facture d\'achat enregistrée.'}
                </td></tr>
              ) : paginated.map(inv => {
                const st = STATUS[inv.payment_status || 'unpaid'];
                const ttc = inv.total_ttc || inv.montant_ht + inv.tva;
                const reste = Math.max(0, ttc - (inv.total_paid || 0));
                return (
                  <tr key={inv.nfact_achat}>
                    <td><strong style={{ color: '#fd7e14' }}>{inv.numero_facture_fournisseur || `#${inv.nfact_achat}`}</strong></td>
                    <td>{inv.supplier_name || inv.nfournisseur}</td>
                    <td>{fmtDate(inv.date_fact)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(inv.montant_ht)} DA</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(ttc)} DA</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: st.color, background: st.bg }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontSize: 16 }}>
                      <div style={{ color: '#155724', fontWeight: 700 }}>{fmt(inv.total_paid || 0)} DA</div>
                      {reste > 0.01 && <div style={{ color: '#721c24', fontSize: 14, fontWeight: 700, textDecoration: 'underline' }}>Reste: {fmt(reste)} DA</div>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button className={styles.editButton} onClick={() => router.push(`/purchases/invoices/${inv.nfact_achat}`)}>👁️ Voir</button>
                        <button className={styles.navButton} style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => router.push(`/purchases/invoices/${inv.nfact_achat}/edit`)}>✏️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 30px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {(page-1)*perPage+1}–{Math.min(page*perPage, filtered.length)} sur {filtered.length} facture{filtered.length > 1 ? 's' : ''}
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

      {/* Résumé */}
      {filtered.length > 0 && (
        <div className={styles.totals} style={{ marginTop: 20, borderRadius: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20 }}>
            {[
              { label: 'Total factures', value: filtered.length, unit: '' },
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
              {totals.unpaid > 0 && <span>❌ {totals.unpaid} non réglée{totals.unpaid > 1 ? 's' : ''}</span>}
              {totals.partial > 0 && <span>⚠️ {totals.partial} partielle{totals.partial > 1 ? 's' : ''}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
