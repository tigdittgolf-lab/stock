'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OverdueDebt {
  document_type: 'purchase_bl' | 'purchase_invoice';
  document_id: number;
  nfournisseur: string;
  supplier_name: string;
  date_doc: string;
  montant_ttc: number;
  paid: number;
  balance: number;
  days_overdue: number;
}

export default function OverdueSuppliersPage() {
  const router = useRouter();
  const [debts, setDebts] = useState<OverdueDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [totalBalance, setTotalBalance] = useState(0);

  const getTenant = () => {
    const ti = localStorage.getItem('tenant_info');
    if (ti) { try { return JSON.parse(ti).schema; } catch {} }
    return localStorage.getItem('selectedTenant') || '2025_bu01';
  };

  useEffect(() => { fetchDebts(); }, [days]);

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const tenant = getTenant();
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
      const res = await fetch(`/api/purchases/overdue?days=${days}`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType }
      });
      const data = await res.json();
      if (data.success) {
        setDebts(data.data.overdue_debts || []);
        setTotalBalance(data.data.total_amount || 0);
      }
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  };

  const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' DA';
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const urgencyColor = (d: number) => d > 60 ? '#c0392b' : d > 30 ? '#e67e22' : '#f39c12';
  const urgencyLabel = (d: number) => d > 60 ? '🔴 Critique' : d > 30 ? '🟠 Urgent' : '🟡 Attention';

  const bySupplier = debts.reduce((acc, d) => {
    const key = d.nfournisseur;
    if (!acc[key]) acc[key] = { name: d.supplier_name || d.nfournisseur, balance: 0, count: 0 };
    acc[key].balance += d.balance;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { name: string; balance: number; count: number }>);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
        background: 'linear-gradient(135deg, #8e44ad, #6c3483)', borderRadius: 12, padding: '20px 24px', color: 'white' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>🏭 Dettes Fournisseurs — Alertes</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>
            Achats non réglés depuis plus de {days} jours
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={days} onChange={e => setDays(parseInt(e.target.value))}
            style={{ padding: '8px 12px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 600 }}>
            <option value={15}>15 jours</option>
            <option value={30}>30 jours</option>
            <option value={60}>60 jours</option>
            <option value={90}>90 jours</option>
          </select>
          <button onClick={fetchDebts}
            style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            🔄
          </button>
          <button onClick={() => router.push('/dashboard')}
            style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Documents non réglés', value: debts.length, color: '#8e44ad' },
          { label: 'Total à payer', value: fmt(totalBalance), color: '#c0392b' },
          { label: 'Fournisseurs concernés', value: Object.keys(bySupplier).length, color: '#2980b9' },
          { label: 'Retard max', value: debts.length ? Math.max(...debts.map(d => d.days_overdue)) + ' j' : '—', color: '#c0392b' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: `2px solid ${s.color}20`, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, fontSize: 18 }}>⏳ Chargement...</div>
      ) : debts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#d4edda', borderRadius: 12, border: '2px solid #28a745' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#155724' }}>Aucune dette depuis {days} jours</div>
          <div style={{ color: '#155724', marginTop: 8 }}>Tous les fournisseurs sont réglés.</div>
        </div>
      ) : (
        <>
          {/* Résumé par fournisseur */}
          <div style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#333' }}>🏭 Résumé par fournisseur</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {Object.entries(bySupplier).sort((a, b) => b[1].balance - a[1].balance).map(([code, info]) => (
                <div key={code} style={{ padding: '8px 14px', background: '#f5f0ff', border: '1px solid #8e44ad', borderRadius: 8, fontSize: 13 }}>
                  <span style={{ fontWeight: 700 }}>{info.name}</span>
                  <span style={{ color: '#666', marginLeft: 6 }}>({info.count} doc)</span>
                  <span style={{ color: '#c0392b', fontWeight: 700, marginLeft: 8 }}>{fmt(info.balance)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tableau détail */}
          <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>Urgence</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>N°</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>Fournisseur</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700 }}>Total TTC</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700 }}>Payé</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700 }}>Reste à payer</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((doc, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: urgencyColor(doc.days_overdue) + '20', color: urgencyColor(doc.days_overdue) }}>
                        {urgencyLabel(doc.days_overdue)} — {doc.days_overdue}j
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: doc.document_type === 'purchase_bl' ? '#e3f2fd' : '#f3e5f5',
                        color: doc.document_type === 'purchase_bl' ? '#1565c0' : '#6a1b9a' }}>
                        {doc.document_type === 'purchase_bl' ? '📦 BL Achat' : '🧾 Fact. Achat'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 700, color: '#333' }}>#{doc.document_id}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{doc.supplier_name || doc.nfournisseur}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{doc.nfournisseur}</div>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 13 }}>{fmtDate(doc.date_doc)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13 }}>{fmt(doc.montant_ttc)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, color: '#28a745' }}>{fmt(doc.paid)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#c0392b' }}>{fmt(doc.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div style={{ marginTop: 20, padding: 20, background: 'linear-gradient(135deg, #8e44ad, #6c3483)', borderRadius: 12, color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>Total dettes fournisseurs ({debts.length} documents)</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{fmt(totalBalance)}</div>
          </div>
        </>
      )}
    </div>
  );
}
