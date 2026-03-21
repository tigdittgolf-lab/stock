'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Avoir {
  id: number;
  nclient: string;
  client_name: string;
  date_avoir: string;
  document_type: 'bl' | 'invoice';
  document_ref: number;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  motif: string;
}

export default function ReturnsList() {
  const router = useRouter();
  const [avoirs, setAvoirs] = useState<Avoir[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const getTenant = () => {
    const ti = localStorage.getItem('tenant_info');
    if (ti) { try { return JSON.parse(ti).schema; } catch {} }
    return localStorage.getItem('selectedTenant') || '2009_bu02';
  };

  useEffect(() => { fetchAvoirs(); }, []);

  const fetchAvoirs = async () => {
    setLoading(true);
    try {
      const tenant = getTenant();
      const res = await fetch('/api/sales/credit-notes', { headers: { 'X-Tenant': tenant } });
      const data = await res.json();
      if (data.success) setAvoirs(data.data || []);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  };

  const filtered = avoirs.filter(a =>
    !search ||
    (a.client_name || a.nclient).toLowerCase().includes(search.toLowerCase()) ||
    String(a.id).includes(search) ||
    String(a.document_ref).includes(search)
  );

  const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' DA';
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const totalAvoirs = filtered.reduce((s, a) => s + (a.montant_ttc || 0), 0);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
        background: 'linear-gradient(135deg, #e74c3c, #c0392b)', borderRadius: 12, padding: '20px 24px', color: 'white' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>↩️ Avoirs & Retours Clients</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>{filtered.length} avoir{filtered.length > 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.push('/delivery-notes/list')}
            style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            📋 BL Ventes
          </button>
          <button onClick={() => router.push('/dashboard')}
            style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Filtre */}
      <div style={{ background: 'white', borderRadius: 10, padding: 16, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e0e0e0' }}>
        <input type="text" placeholder="🔍 Rechercher par client, N° avoir, N° document..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
      </div>

      {/* Tableau */}
      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#666', fontSize: 16 }}>⏳ Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#999', fontSize: 16 }}>
            {search ? 'Aucun résultat pour cette recherche.' : 'Aucun avoir enregistré.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>N° Avoir</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>Client</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700 }}>Document origine</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700 }}>Montant HT</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700 }}>Total TTC</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>Motif</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((avoir, i) => (
                <tr key={avoir.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 700, color: '#e74c3c', fontSize: 14 }}>
                    AV-{String(avoir.id).padStart(4, '0')}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>{avoir.client_name || avoir.nclient}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>Code: {avoir.nclient}</div>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 13 }}>{fmtDate(avoir.date_avoir)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: avoir.document_type === 'bl' ? '#e3f2fd' : '#e8f5e9',
                      color: avoir.document_type === 'bl' ? '#1565c0' : '#2e7d32' }}>
                      {avoir.document_type === 'bl' ? '📋 BL' : '🧾 Facture'} #{avoir.document_ref}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13 }}>{fmt(avoir.montant_ht)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#e74c3c' }}>
                    {fmt(avoir.montant_ttc)}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#666', maxWidth: 180 }}>
                    {avoir.motif || '—'}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <button onClick={() => router.push(`/returns/${avoir.id}`)}
                      style={{ padding: '6px 14px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      👁️ Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Résumé */}
      {filtered.length > 0 && (
        <div style={{ marginTop: 20, padding: 20, background: 'linear-gradient(135deg, #e74c3c, #c0392b)', borderRadius: 12, color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>Total avoirs ({filtered.length})</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{fmt(totalAvoirs)}</div>
        </div>
      )}
    </div>
  );
}
