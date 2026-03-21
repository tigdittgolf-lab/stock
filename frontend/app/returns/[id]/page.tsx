'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

interface AvoirDetail {
  narticle: string;
  designation: string;
  qte: number;
  prix: number;
  tva: number;
  montant_ht: number;
  montant_ttc: number;
}

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
  details: AvoirDetail[];
}

export default function AvoirDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [avoir, setAvoir] = useState<Avoir | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getTenant = () => {
    const ti = localStorage.getItem('tenant_info');
    if (ti) { try { return JSON.parse(ti).schema; } catch {} }
    return localStorage.getItem('selectedTenant') || '2009_bu02';
  };

  useEffect(() => { fetchAvoir(); }, [id]);

  const fetchAvoir = async () => {
    setLoading(true);
    try {
      const tenant = getTenant();
      const res = await fetch(`/api/sales/credit-notes/${id}`, { headers: { 'X-Tenant': tenant } });
      const data = await res.json();
      if (data.success && data.data) {
        setAvoir(data.data);
      } else {
        setError('Avoir introuvable');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' DA';
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  if (loading) return <div style={{ padding: 60, textAlign: 'center', fontSize: 18 }}>⏳ Chargement...</div>;
  if (error || !avoir) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ color: '#e74c3c', fontSize: 18, marginBottom: 20 }}>❌ {error || 'Avoir introuvable'}</div>
      <button onClick={() => router.push('/returns/list')}
        style={{ padding: '10px 20px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
        ← Retour à la liste
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
        background: 'linear-gradient(135deg, #e74c3c, #c0392b)', borderRadius: 12, padding: '20px 24px', color: 'white' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>↩️ Avoir AV-{String(avoir.id).padStart(4, '0')}</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>
            {avoir.document_type === 'bl' ? 'Retour sur BL' : 'Retour sur Facture'} N° {avoir.document_ref}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.push(`/${avoir.document_type === 'bl' ? 'delivery-notes' : 'invoices'}/list`)}
            style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            {avoir.document_type === 'bl' ? '📋 BL' : '🧾 Facture'} #{avoir.document_ref}
          </button>
          <button onClick={() => router.push('/returns/list')}
            style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            ← Liste Avoirs
          </button>
        </div>
      </div>

      {/* Infos générales */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#333' }}>📋 Informations de l'avoir</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>N° Avoir</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e74c3c' }}>AV-{String(avoir.id).padStart(4, '0')}</div>
          </div>
          <div style={{ padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Client</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{avoir.client_name || avoir.nclient}</div>
            <div style={{ fontSize: 11, color: '#999' }}>Code: {avoir.nclient}</div>
          </div>
          <div style={{ padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Date</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{fmtDate(avoir.date_avoir)}</div>
          </div>
          <div style={{ padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Document origine</div>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: avoir.document_type === 'bl' ? '#e3f2fd' : '#e8f5e9',
              color: avoir.document_type === 'bl' ? '#1565c0' : '#2e7d32' }}>
              {avoir.document_type === 'bl' ? '📋 BL' : '🧾 Facture'} #{avoir.document_ref}
            </span>
          </div>
        </div>
        {avoir.motif && (
          <div style={{ marginTop: 16, padding: 12, background: '#fff5f5', borderRadius: 8, border: '1px solid #ffcdd2' }}>
            <span style={{ fontSize: 13, color: '#666' }}>Motif: </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#c0392b' }}>{avoir.motif}</span>
          </div>
        )}
      </div>

      {/* Détail articles */}
      {avoir.details && avoir.details.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#333' }}>📦 Articles retournés</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>Article</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>Désignation</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 700 }}>Qté retournée</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, fontWeight: 700 }}>Prix unitaire</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 700 }}>TVA</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, fontWeight: 700 }}>Montant HT</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, fontWeight: 700 }}>Montant TTC</th>
              </tr>
            </thead>
            <tbody>
              {avoir.details.map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#e74c3c', fontSize: 13 }}>{d.narticle}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{d.designation}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 14, fontWeight: 700 }}>{d.qte}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13 }}>{fmt(d.prix)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13 }}>{d.tva}%</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13 }}>{fmt(d.montant_ht)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#e74c3c' }}>{fmt(d.montant_ttc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totaux */}
      <div style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)', borderRadius: 12, padding: 24, color: 'white' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>Montant HT</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{fmt(avoir.montant_ht)}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>TVA</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{fmt(avoir.tva)}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>Total TTC</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{fmt(avoir.montant_ttc)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
