'use client';

import { useState, useEffect, useMemo } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from '../purchases/purchases.module.css';

interface SupplierDebt {
  nfournisseur: string;
  nom_fournisseur: string;
  total_achats: number;
  total_paye: number;
  dette: number;
  nb_factures: number;
  nb_bls: number;
}

interface ClientCreance {
  nclient: string;
  nom_client: string;
  total_ventes: number;
  total_paye: number;
  creance: number;
  nb_factures: number;
  nb_bls: number;
}

type Tab = 'dettes' | 'creances' | 'synthese';

export default function FinancesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('synthese');
  const [debts, setDebts] = useState<SupplierDebt[]>([]);
  const [creances, setCreances] = useState<ClientCreance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterZero, setFilterZero] = useState(true);
  const [search, setSearch] = useState('');

  const getTenant = () => {
    const ti = localStorage.getItem('tenant_info');
    if (ti) { try { return JSON.parse(ti).schema || '2009_bu02'; } catch {} }
    return localStorage.getItem('selectedTenant') || '2009_bu02';
  };

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const tenant = getTenant();
      const headers = { 'X-Tenant': tenant };

      // Charger en parallèle: factures achat, BL achat, factures vente, BL vente
      const [invRes, blRes, salesInvRes, salesBlRes] = await Promise.all([
        fetch(getApiUrl('purchases/invoices'), { headers }),
        fetch(getApiUrl('purchases/delivery-notes'), { headers }),
        fetch(getApiUrl('sales/invoices'), { headers }),
        fetch(getApiUrl('sales/delivery-notes'), { headers }),
      ]);

      const [invData, blData, salesInvData, salesBlData] = await Promise.all([
        invRes.json(), blRes.json(), salesInvRes.json(), salesBlRes.json()
      ]);

      const purchaseInvoices = invData.success ? (invData.data || []) : [];
      const purchaseBLs = blData.success ? (blData.data || []) : [];
      const salesInvoices = salesInvData.success ? (salesInvData.data || []) : [];
      const salesBLs = salesBlData.success ? (salesBlData.data || []) : [];

      // Calculer dettes fournisseurs
      await computeDebts(tenant, purchaseInvoices, purchaseBLs);
      // Calculer créances clients
      await computeCreances(tenant, salesInvoices, salesBLs);

    } catch (e) {
      setError('Erreur de chargement des données financières');
    } finally {
      setLoading(false);
    }
  };

  const computeDebts = async (tenant: string, invoices: any[], bls: any[]) => {
    const headers = { 'X-Tenant': tenant };
    // UNE SEULE requête pour tous les paiements achats
    let payMap: Record<string, number> = {};
    try {
      const pr = await fetch(getApiUrl('purchases/payments/summary'), { headers });
      const pd = await pr.json();
      if (pd.success) payMap = pd.data || {};
    } catch {}

    const map = new Map<string, SupplierDebt>();
    const addDoc = (doc: any, type: 'inv' | 'bl', docType: string, docId: any) => {
      const key = doc.nfournisseur;
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, { nfournisseur: key, nom_fournisseur: doc.supplier_name || doc.nom_fournisseur || key, total_achats: 0, total_paye: 0, dette: 0, nb_factures: 0, nb_bls: 0 });
      }
      const entry = map.get(key)!;
      const ttc = doc.total_ttc || (doc.montant_ht || 0) + (doc.tva || 0);
      entry.total_achats += ttc;
      entry.total_paye += payMap[`${docType}::${docId}`] || 0;
      if (type === 'inv') entry.nb_factures++; else entry.nb_bls++;
    };

    invoices.forEach(i => addDoc(i, 'inv', 'purchase_invoice', i.nfact_achat));
    bls.forEach(b => addDoc(b, 'bl', 'purchase_delivery_note', b.nbl_achat));

    map.forEach(e => { e.dette = Math.max(0, e.total_achats - e.total_paye); });
    setDebts([...map.values()].sort((a, b) => b.dette - a.dette));
  };

  const computeCreances = async (tenant: string, invoices: any[], bls: any[]) => {
    const headers = { 'X-Tenant': tenant };
    // UNE SEULE requête pour tous les paiements ventes
    let payMap: Record<string, number> = {};
    try {
      const pr = await fetch(getApiUrl('sales/payments/summary'), { headers });
      const pd = await pr.json();
      if (pd.success) payMap = pd.data || {};
    } catch {}

    const map = new Map<string, ClientCreance>();
    const addDoc = (doc: any, type: 'inv' | 'bl', docType: string, docId: any) => {
      const key = doc.nclient || doc.Nclient;
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, { nclient: key, nom_client: doc.client_name || doc.raison_sociale || key, total_ventes: 0, total_paye: 0, creance: 0, nb_factures: 0, nb_bls: 0 });
      }
      const entry = map.get(key)!;
      const ttc = doc.montant_ttc || doc.total_ttc || (doc.montant_ht || 0) + (doc.tva || 0);
      entry.total_ventes += ttc;
      entry.total_paye += payMap[`${docType}::${docId}`] || 0;
      if (type === 'inv') entry.nb_factures++; else entry.nb_bls++;
    };

    invoices.forEach(i => addDoc(i, 'inv', 'invoice', i.nfact || i.id));
    bls.forEach(b => addDoc(b, 'bl', 'delivery_note', b.nbl || b.id));

    map.forEach(e => { e.creance = Math.max(0, e.total_ventes - e.total_paye); });
    setCreances([...map.values()].sort((a, b) => b.creance - a.creance));
  };

  const fmt = (n: number) => (n ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const filteredDebts = useMemo(() => debts.filter(d =>
    (!filterZero || d.dette > 0.01) &&
    (!search || d.nom_fournisseur.toLowerCase().includes(search.toLowerCase()) || d.nfournisseur.toLowerCase().includes(search.toLowerCase()))
  ), [debts, filterZero, search]);

  const filteredCreances = useMemo(() => creances.filter(c =>
    (!filterZero || c.creance > 0.01) &&
    (!search || c.nom_client.toLowerCase().includes(search.toLowerCase()) || c.nclient.toLowerCase().includes(search.toLowerCase()))
  ), [creances, filterZero, search]);

  const totalDettes = debts.reduce((s, d) => s + d.dette, 0);
  const totalCreances = creances.reduce((s, c) => s + c.creance, 0);
  const solde = totalCreances - totalDettes;

  if (loading) return (
    <div className={styles.container}>
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)', fontSize: 18 }}>
        ⏳ Calcul des données financières...
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>💼 Situation Financière</div>
        <div className={styles.headerButtons}>
          <button className={styles.navButton} onClick={loadAll}>🔄 Actualiser</button>
          <button className={styles.backButton} onClick={() => router.push('/dashboard')}>← Tableau de bord</button>
        </div>
      </div>

      {error && <div className={styles.errorMsg}>❌ {error}</div>}

      {/* Synthèse globale */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#721c24', fontWeight: 600, marginBottom: 6 }}>💸 Dettes Fournisseurs</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#721c24' }}>{fmt(totalDettes)} DA</div>
          <div style={{ fontSize: 12, color: '#721c24', marginTop: 4 }}>{debts.filter(d => d.dette > 0.01).length} fournisseur(s)</div>
        </div>
        <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#155724', fontWeight: 600, marginBottom: 6 }}>💰 Créances Clients</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#155724' }}>{fmt(totalCreances)} DA</div>
          <div style={{ fontSize: 12, color: '#155724', marginTop: 4 }}>{creances.filter(c => c.creance > 0.01).length} client(s)</div>
        </div>
        <div style={{
          background: solde >= 0 ? '#d4edda' : '#f8d7da',
          border: `1px solid ${solde >= 0 ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: 12, padding: 20, textAlign: 'center'
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: solde >= 0 ? '#155724' : '#721c24' }}>
            {solde >= 0 ? '📈 Solde Net Positif' : '📉 Solde Net Négatif'}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: solde >= 0 ? '#155724' : '#721c24' }}>
            {solde >= 0 ? '+' : ''}{fmt(solde)} DA
          </div>
          <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-secondary)' }}>Créances − Dettes</div>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border-color)' }}>
        {([['synthese', '📊 Synthèse'], ['dettes', '💸 Dettes Fournisseurs'], ['creances', '💰 Créances Clients']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            background: tab === t ? 'linear-gradient(135deg, #fd7e14, #e55a00)' : 'transparent',
            color: tab === t ? 'white' : 'var(--text-secondary)',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.2s'
          }}>{label}</button>
        ))}
      </div>

      {/* Filtres communs */}
      {tab !== 'synthese' && (
        <div className={styles.form} style={{ marginBottom: 16 }}>
          <div className={styles.section} style={{ paddingBottom: 16 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div className={styles.formGroup} style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
                <label>Recherche</label>
                <input type="text" placeholder="Nom ou code..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                <input type="checkbox" checked={filterZero} onChange={e => setFilterZero(e.target.checked)} />
                Masquer les soldes à zéro
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Onglet Synthèse */}
      {tab === 'synthese' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Top dettes */}
          <div className={styles.form}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>💸 Top Dettes Fournisseurs</div>
              {debts.filter(d => d.dette > 0.01).slice(0, 5).length === 0
                ? <div className={styles.emptyState}>✅ Aucune dette fournisseur</div>
                : debts.filter(d => d.dette > 0.01).slice(0, 5).map(d => (
                  <div key={d.nfournisseur} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{d.nom_fournisseur}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.nb_factures} fact. · {d.nb_bls} BL</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#dc3545' }}>{fmt(d.dette)} DA</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>/ {fmt(d.total_achats)} DA</div>
                    </div>
                  </div>
                ))
              }
              <button className={styles.navButton} style={{ marginTop: 12, width: '100%' }} onClick={() => setTab('dettes')}>
                Voir tout →
              </button>
            </div>
          </div>
          {/* Top créances */}
          <div className={styles.form}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>💰 Top Créances Clients</div>
              {creances.filter(c => c.creance > 0.01).slice(0, 5).length === 0
                ? <div className={styles.emptyState}>✅ Aucune créance client</div>
                : creances.filter(c => c.creance > 0.01).slice(0, 5).map(c => (
                  <div key={c.nclient} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{c.nom_client}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.nb_factures} fact. · {c.nb_bls} BL</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#fd7e14' }}>{fmt(c.creance)} DA</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>/ {fmt(c.total_ventes)} DA</div>
                    </div>
                  </div>
                ))
              }
              <button className={styles.navButton} style={{ marginTop: 12, width: '100%' }} onClick={() => setTab('creances')}>
                Voir tout →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onglet Dettes */}
      {tab === 'dettes' && (
        <div className={styles.form}>
          <div className={styles.section}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Fournisseur</th>
                  <th style={{ textAlign: 'right' }}>Total Achats</th>
                  <th style={{ textAlign: 'right' }}>Total Payé</th>
                  <th style={{ textAlign: 'right' }}>Dette</th>
                  <th style={{ textAlign: 'center' }}>Docs</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDebts.length === 0
                  ? <tr><td colSpan={7} className={styles.emptyState}>✅ Aucune dette fournisseur</td></tr>
                  : filteredDebts.map(d => {
                    const pct = d.total_achats > 0 ? (d.total_paye / d.total_achats) * 100 : 0;
                    return (
                      <tr key={d.nfournisseur}>
                        <td style={{ color: '#fd7e14', fontWeight: 600 }}>{d.nfournisseur}</td>
                        <td><strong>{d.nom_fournisseur}</strong></td>
                        <td style={{ textAlign: 'right' }}>{fmt(d.total_achats)} DA</td>
                        <td style={{ textAlign: 'right', color: '#155724' }}>
                          {fmt(d.total_paye)} DA
                          <div style={{ height: 4, background: '#e9ecef', borderRadius: 2, marginTop: 4 }}>
                            <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: '#28a745', borderRadius: 2 }} />
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: d.dette > 0 ? '#dc3545' : '#155724' }}>
                          {d.dette > 0 ? fmt(d.dette) + ' DA' : '✅ Soldé'}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                          {d.nb_factures}F · {d.nb_bls}BL
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button className={styles.editButton} onClick={() => router.push('/purchases/invoices/list')}>
                            Voir factures
                          </button>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
          {filteredDebts.length > 0 && (
            <div className={styles.totals} style={{ margin: '0 30px 30px', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>Total Achats</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{fmt(filteredDebts.reduce((s, d) => s + d.total_achats, 0))} DA</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>Total Payé</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{fmt(filteredDebts.reduce((s, d) => s + d.total_paye, 0))} DA</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>Total Dettes</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(filteredDebts.reduce((s, d) => s + d.dette, 0))} DA</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Onglet Créances */}
      {tab === 'creances' && (
        <div className={styles.form}>
          <div className={styles.section}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Client</th>
                  <th style={{ textAlign: 'right' }}>Total Ventes</th>
                  <th style={{ textAlign: 'right' }}>Total Payé</th>
                  <th style={{ textAlign: 'right' }}>Créance</th>
                  <th style={{ textAlign: 'center' }}>Docs</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCreances.length === 0
                  ? <tr><td colSpan={7} className={styles.emptyState}>✅ Aucune créance client</td></tr>
                  : filteredCreances.map(c => {
                    const pct = c.total_ventes > 0 ? (c.total_paye / c.total_ventes) * 100 : 0;
                    return (
                      <tr key={c.nclient}>
                        <td style={{ color: '#fd7e14', fontWeight: 600 }}>{c.nclient}</td>
                        <td><strong>{c.nom_client}</strong></td>
                        <td style={{ textAlign: 'right' }}>{fmt(c.total_ventes)} DA</td>
                        <td style={{ textAlign: 'right', color: '#155724' }}>
                          {fmt(c.total_paye)} DA
                          <div style={{ height: 4, background: '#e9ecef', borderRadius: 2, marginTop: 4 }}>
                            <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: '#28a745', borderRadius: 2 }} />
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: c.creance > 0 ? '#fd7e14' : '#155724' }}>
                          {c.creance > 0 ? fmt(c.creance) + ' DA' : '✅ Soldé'}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                          {c.nb_factures}F · {c.nb_bls}BL
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button className={styles.editButton} onClick={() => router.push('/invoices/list')}>
                            Voir factures
                          </button>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
          {filteredCreances.length > 0 && (
            <div className={styles.totals} style={{ margin: '0 30px 30px', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>Total Ventes</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{fmt(filteredCreances.reduce((s, c) => s + c.total_ventes, 0))} DA</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>Total Encaissé</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{fmt(filteredCreances.reduce((s, c) => s + c.total_paye, 0))} DA</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>Total Créances</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(filteredCreances.reduce((s, c) => s + c.creance, 0))} DA</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
