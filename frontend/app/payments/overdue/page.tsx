'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OverdueDoc {
  document_type: 'delivery_note' | 'invoice';
  document_id: number;
  nclient: string;
  client_name: string;
  date_fact: string;
  montant_ttc: number;
  paid: number;
  balance: number;
  days_overdue: number;
}

export default function OverduePage() {
  const router = useRouter();
  const [docs, setDocs] = useState<OverdueDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [totalBalance, setTotalBalance] = useState(0);

  const getTenant = () => {
    const ti = localStorage.getItem('tenant_info');
    if (ti) { try { return JSON.parse(ti).schema; } catch {} }
    return localStorage.getItem('selectedTenant') || '2009_bu02';
  };

  useEffect(() => { fetchOverdue(); }, [days]);

  const fetchOverdue = async () => {
    setLoading(true);
    try {
      const tenant = getTenant();
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
      const res = await fetch(`/api/sales/payments/overdue?days=${days}`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType }
      });
      const data = await res.json();
      if (data.success) {
        setDocs(data.data.overdue_payments || []);
        setTotalBalance(data.data.total_amount || 0);
      }
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  };

  const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' DA';
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const urgencyColor = (d: number) => d > 60 ? '#c0392b' : d > 30 ? '#e67e22' : '#f39c12';
  const urgencyLabel = (d: number) => d > 60 ? '🔴 Critique' : d > 30 ? '🟠 Urgent' : '🟡 Attention';

  const byClient = docs.reduce((acc, d) => {
    const key = d.nclient;
    if (!acc[key]) acc[key] = { name: d.client_name || d.nclient, balance: 0, count: 0 };
    acc[key].balance += d.balance;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { name: string; balance: number; count: number }>);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
        background: 'linear-gradient(135deg, #e67e22, #d35400)', borderRadius: 12, padding: '20px 24px', color: 'white' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>⚠️ Recouvrement — Impayés</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>
            Documents avec solde restant depuis plus de {days} jours
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
          <button onClick={fetchOverdue}
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
          { label: 'Documents impayés', value: docs.length, color: '#e67e22' },
          { label: 'Montant total restant', value: fmt(totalBalance), color: '#c0392b' },
          { label: 'Clients concernés', value: Object.keys(byClient).length, color: '#8e44ad' },
          { label: 'Retard max', value: docs.length ? Math.max(...docs.map(d => d.days_overdue)) + ' j' : '—', color: '#c0392b' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: `2px solid ${s.color}20`, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, fontSize: 18 }}>⏳ Chargement...</div>
      ) : docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#d4edda', borderRadius: 12, border: '2px solid #28a745' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#155724' }}>Aucun impayé depuis {days} jours</div>
          <div style={{ color: '#155724', marginTop: 8 }}>Tous les documents sont réglés.</div>
        </div>
      ) : (
        <>
          {/* Résumé par client */}
          <div style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#333' }}>👥 Résumé par client</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {Object.entries(byClient).sort((a, b) => b[1].balance - a[1].balance).map(([code, info]) => (
                <div key={code} style={{ padding: '8px 14px', background: '#fff5f0', border: '1px solid #e67e22', borderRadius: 8, fontSize: 13 }}>
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
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>Client</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700 }}>Total TTC</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700 }}>Payé</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700 }}>Reste</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: urgencyColor(doc.days_overdue) + '20', color: urgencyColor(doc.days_overdue) }}>
                        {urgencyLabel(doc.days_overdue)} — {doc.days_overdue}j
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: doc.document_type === 'delivery_note' ? '#e3f2fd' : '#e8f5e9',
                        color: doc.document_type === 'delivery_note' ? '#1565c0' : '#2e7d32' }}>
                        {doc.document_type === 'delivery_note' ? '📋 BL' : '🧾 Facture'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 700, color: '#333' }}>#{doc.document_id}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{doc.client_name || doc.nclient}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{doc.nclient}</div>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 13 }}>{fmtDate(doc.date_fact)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13 }}>{fmt(doc.montant_ttc)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, color: '#28a745' }}>{fmt(doc.paid)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#c0392b',
                      textDecoration: 'underline' }}>{fmt(doc.balance)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => router.push(`/payments/add?type=${doc.document_type}&id=${doc.document_id}`)}
                          style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          💰 Payer
                        </button>
                        <button onClick={() => router.push(`/payments/history?type=${doc.document_type}&id=${doc.document_id}`)}
                          style={{ padding: '6px 12px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          📜
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div style={{ marginTop: 20, padding: 20, background: 'linear-gradient(135deg, #e67e22, #d35400)', borderRadius: 12, color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>Total à recouvrer ({docs.length} documents)</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{fmt(totalBalance)}</div>
          </div>
        </>
      )}
    </div>
  );
}
