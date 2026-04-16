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
  total_ligne?: number;
  montant_ht?: number;
  montant_ttc?: number;
}

interface Avoir {
  id: number;
  nclient: string;
  client_name?: string;
  date_avoir: string;
  document_type: 'bl' | 'invoice';
  document_ref: number;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  motif?: string;
  details: AvoirDetail[];
}

const fmt = (n: number) => (Math.round((n || 0) * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DA';
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

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

  const getDbType = () => {
    const cfg = localStorage.getItem('activeDbConfig');
    if (cfg) { try { return JSON.parse(cfg).type || 'supabase'; } catch {} }
    return 'supabase';
  };

  useEffect(() => { fetchAvoir(); }, [id]);

  const fetchAvoir = async () => {
    setLoading(true);
    try {
      const tenant = getTenant();
      const dbType = getDbType();
      const res = await fetch(`/api/sales/credit-notes/${id}`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType }
      });
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

  const goToOrigin = () => {
    if (!avoir) return;
    if (avoir.document_type === 'bl') {
      router.push(`/delivery-notes/${avoir.document_ref}`);
    } else {
      router.push(`/invoices/details/${avoir.document_ref}`);
    }
  };

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'sans-serif' }}>
      ⏳ Chargement...
    </div>
  );

  if (error || !avoir) return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ color: '#e74c3c', fontSize: 18, marginBottom: 20 }}>❌ {error || 'Avoir introuvable'}</div>
      <button onClick={() => router.push('/returns/list')}
        style={{ padding: '10px 20px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
        ← Retour à la liste
      </button>
    </div>
  );

  const docLabel = avoir.document_type === 'bl' ? 'BL' : 'Facture';
  const docIcon = avoir.document_type === 'bl' ? '📋' : '🧾';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 20, background: 'var(--background)', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
        background: 'linear-gradient(135deg, #e74c3c, #c0392b)', borderRadius: 12, padding: '20px 24px', color: 'white' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>↩️ Avoir N° {avoir.id}</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>
            Retour sur {docLabel} N° {avoir.document_ref} · {fmtDate(avoir.date_avoir)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={goToOrigin}
            style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.25)', color: 'white', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            {docIcon} Voir {docLabel} #{avoir.document_ref}
          </button>
          <button onClick={() => router.push('/returns/list')}
            style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            ← Liste Avoirs
          </button>
        </div>
      </div>

      {/* Breadcrumb / Lien document origine */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: 'var(--text-tertiary)' }}>
        <span style={{ cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => router.push('/returns/list')}>
          Liste des avoirs
        </span>
        <span>›</span>
        <span style={{ cursor: 'pointer', color: 'var(--primary-color)' }} onClick={goToOrigin}>
          {docIcon} {docLabel} #{avoir.document_ref}
        </span>
        <span>›</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Avoir #{avoir.id}</span>
      </div>

      {/* Infos générales */}
      <div style={{ background: 'var(--card-background)', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>📋 Informations de l'avoir</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'N° Avoir', value: `AV-${String(avoir.id).padStart(4, '0')}`, color: '#e74c3c', large: true },
            { label: 'Client', value: avoir.client_name || avoir.nclient, sub: `Code: ${avoir.nclient}` },
            { label: 'Date avoir', value: fmtDate(avoir.date_avoir) },
            { label: 'Document origine', value: `${docIcon} ${docLabel} #${avoir.document_ref}`, link: true },
          ].map((item, i) => (
            <div key={i} style={{ padding: '12px 14px', background: 'var(--background-secondary)', borderRadius: 8, border: '1px solid var(--border-color)',
              cursor: item.link ? 'pointer' : 'default' }}
              onClick={item.link ? goToOrigin : undefined}
              onMouseEnter={item.link ? e => { e.currentTarget.style.borderColor = '#e74c3c'; } : undefined}
              onMouseLeave={item.link ? e => { e.currentTarget.style.borderColor = 'var(--border-color)'; } : undefined}
            >
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
              <div style={{ fontSize: item.large ? 18 : 14, fontWeight: 700, color: item.color || 'var(--text-primary)' }}>{item.value}</div>
              {item.sub && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{item.sub}</div>}
              {item.link && <div style={{ fontSize: 11, color: '#e74c3c', marginTop: 4 }}>Cliquer pour voir →</div>}
            </div>
          ))}
        </div>

        {avoir.motif && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--error-bg)', borderRadius: 8, border: '1px solid var(--error-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>💬</span>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Motif: </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--error-text)' }}>{avoir.motif}</span>
            </div>
          </div>
        )}
      </div>

      {/* Détail articles */}
      <div style={{ background: 'var(--card-background)', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>📦 Articles retournés</div>
        {avoir.details && avoir.details.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--background-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                {['Article','Désignation','Qté retournée','Prix unitaire','TVA','Total TTC'].map((h, i) => (
                  <th key={i} style={{ padding: '10px 12px', textAlign: i >= 2 ? 'right' : 'left', fontWeight: 700, color: 'var(--text-primary)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {avoir.details.map((d, i) => {
                const ht = d.qte * d.prix;
                const ttc = ht * (1 + (d.tva || 0) / 100);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : 'var(--background-secondary)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#e74c3c' }}>{d.narticle}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>{d.designation || '—'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>{d.qte}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>{fmt(d.prix)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{d.tva || 0}%</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#e74c3c' }}>{fmt(d.total_ligne || ttc)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            Aucun détail disponible
          </div>
        )}
      </div>

      {/* Totaux */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <div style={{ minWidth: 320, background: 'var(--card-background)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          {[
            { label: 'Montant HT', val: avoir.montant_ht },
            { label: 'TVA', val: avoir.tva },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{r.label}</span>
              <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{fmt(r.val)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#e74c3c' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>TOTAL AVOIR TTC</span>
            <span style={{ color: 'white', fontWeight: 800, fontSize: 20 }}>{fmt(avoir.montant_ttc)}</span>
          </div>
        </div>
      </div>

      {/* Action retour vers document */}
      <button onClick={goToOrigin}
        style={{ width: '100%', padding: '14px', background: 'var(--background-secondary)', color: 'var(--text-primary)', border: '2px solid var(--border-color)', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {docIcon} Retourner au {docLabel} N° {avoir.document_ref}
      </button>
    </div>
  );
}
