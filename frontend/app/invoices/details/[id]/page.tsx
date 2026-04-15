'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Detail {
  narticle: string;
  designation: string;
  qte: number;
  prix: number;
  tva: number;
  total_ligne: number;
}

interface Company {
  name: string; address?: string; commune?: string; wilaya?: string;
  phone?: string; email?: string; nif?: string; rc?: string; art?: string; nis?: string;
  activite?: string;
}

interface InvoiceData {
  nfact: number;
  date_fact: string;
  nclient: string;
  client_name: string;
  client: { raison_sociale?: string; adresse?: string; telephone?: string; nif?: string; rc?: string; art?: string };
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  timbre?: number;
  details: Detail[];
  company?: Company;
}

const fmt = (n: number) => (Math.round((n || 0) * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DA';
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '';
const fv = (obj: any, ...keys: string[]) => {
  if (!obj) return '';
  const objKeys = Object.keys(obj);
  for (const k of keys) {
    const found = objKeys.find(ok => ok.toLowerCase() === k.toLowerCase());
    if (found && obj[found]) return obj[found];
  }
  return '';
};

export default function InvoiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tenantInfo = localStorage.getItem('tenant_info');
    if (!tenantInfo) { router.push('/login'); return; }
    try {
      const t = JSON.parse(tenantInfo);
      load(t.schema, id);
    } catch { router.push('/login'); }
  }, [id]);

  const load = async (tenant: string, factId: string) => {
    setLoading(true);
    try {
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
      const headers = { 'X-Tenant': tenant, 'X-Database-Type': dbType };

      const [invRes, compRes] = await Promise.all([
        fetch(`/api/sales/invoices/${factId}`, { headers }),
        fetch('/api/settings/activities', { headers }),
      ]);

      if (!invRes.ok) throw new Error(`HTTP ${invRes.status}`);
      const invData = await invRes.json();
      if (!invData.success) throw new Error(invData.error || 'Erreur');

      const raw = invData.data;
      const details: Detail[] = (raw.details || raw.detail_fact || []).map((d: any) => ({
        narticle: fv(d, 'narticle', 'Narticle') || '',
        designation: fv(d, 'designation', 'Designation') || '',
        qte: parseFloat(fv(d, 'qte', 'Qte') || 0),
        prix: parseFloat(fv(d, 'prix', 'Prix', 'prix_unitaire') || 0),
        tva: parseFloat(fv(d, 'tva', 'TVA') || 0),
        total_ligne: parseFloat(fv(d, 'total_ligne', 'Total_ligne') || 0) || (parseFloat(fv(d,'qte','Qte')||0) * parseFloat(fv(d,'prix','Prix')||0)),
      }));

      setInvoice({
        nfact: raw.nfact || parseInt(factId),
        date_fact: raw.date_fact || '',
        nclient: raw.nclient || '',
        client_name: raw.client_name || raw.client?.raison_sociale || raw.nclient || '',
        client: raw.client || {},
        montant_ht: parseFloat(raw.montant_ht || 0),
        tva: parseFloat(raw.tva || raw.montant_tva || 0),
        montant_ttc: parseFloat(raw.montant_ttc || raw.total_ttc || 0) || (parseFloat(raw.montant_ht||0) + parseFloat(raw.tva||0)),
        timbre: parseFloat(raw.timbre || 0),
        details,
      });

      // Company info
      try {
        const compData = await compRes.json();
        const c = compData.success && compData.data?.length > 0 ? compData.data[0] : {};
        setCompany({
          name: fv(c,'nom_entreprise','name') || '',
          address: fv(c,'adresse','address') || '',
          commune: fv(c,'commune') || '',
          wilaya: fv(c,'wilaya') || '',
          phone: fv(c,'telephone','tel_fixe','phone') || '',
          email: fv(c,'email','e_mail') || '',
          nif: fv(c,'nif','ident_fiscal') || '',
          rc: fv(c,'rc','nrc') || '',
          art: fv(c,'nart','art') || '',
          nis: fv(c,'nis') || '',
          activite: fv(c,'activite','sous_domaine','domaine_activite') || '',
        });
      } catch {}

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openPrint = () => {
    const tenant = localStorage.getItem('selectedTenant') || '';
    window.open(`/print/invoice/${id}?tenant=${encodeURIComponent(tenant)}&lang=bilingual`, '_blank');
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>⏳ Chargement...</div>;
  if (error) return (
    <div style={{ padding: 20 }}>
      <div style={{ background: 'var(--error-bg)', color: 'var(--error-text)', padding: 20, borderRadius: 8 }}>
        ❌ {error}
        <button onClick={() => router.back()} style={{ marginLeft: 16, padding: '6px 14px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>← Retour</button>
      </div>
    </div>
  );
  if (!invoice) return null;

  const clientObj = invoice.client || {};

  return (
    <div style={{ padding: '20px', background: 'var(--background)', minHeight: '100vh', maxWidth: 960, margin: '0 auto' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 24, color: 'var(--text-primary)', fontWeight: 700 }}>🧾 Facture N° {invoice.nfact}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.back()} style={{ padding: '10px 18px', background: 'var(--background-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>← Retour</button>
          <button onClick={openPrint} style={{ padding: '10px 18px', background: 'linear-gradient(135deg,#28a745,#20c997)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>🖨️ Imprimer</button>
        </div>
      </div>

      {/* En-tête : Entreprise | Facture | Client */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 20, background: 'var(--card-background)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 24, marginBottom: 20 }}>

        {/* Entreprise (vendeur) */}
        <div style={{ fontSize: 13, lineHeight: 1.9, color: 'var(--text-primary)' }}>
          <div style={{ fontWeight: 800, fontSize: 15, textTransform: 'uppercase', marginBottom: 6 }}>{company?.name || '—'}</div>
          {company?.activite && <div style={{ fontStyle: 'italic', color: 'var(--text-tertiary)', fontSize: 12 }}>{company.activite}</div>}
          {company?.address && <div>{company.address}{company.commune ? ', '+company.commune : ''}{company.wilaya ? ' - '+company.wilaya : ''}</div>}
          {company?.phone && <div>Tél: {company.phone}</div>}
          {company?.email && <div>{company.email}</div>}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
            {company?.nif && <div><strong>NIF:</strong> {company.nif}</div>}
            {company?.rc && <div><strong>RC:</strong> {company.rc}</div>}
            {company?.art && <div><strong>Art:</strong> {company.art}</div>}
            {company?.nis && <div><strong>NIS:</strong> {company.nis}</div>}
          </div>
        </div>

        {/* Titre + N° + Date */}
        <div style={{ textAlign: 'center', minWidth: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 2, color: 'var(--success-color)' }}>FACTURE</div>
          <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text-primary)', lineHeight: 2.2 }}>
            <div><strong>N°</strong> {invoice.nfact}</div>
            <div><strong>Date:</strong> {fmtDate(invoice.date_fact)}</div>
          </div>
        </div>

        {/* Client (acheteur) */}
        <div style={{ fontSize: 13, lineHeight: 1.9, color: 'var(--text-primary)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>CLIENT / ACHETEUR</div>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 6, padding: '10px 12px', background: 'var(--background-secondary)' }}>
            <div style={{ fontWeight: 800, fontSize: 14, textTransform: 'uppercase' }}>{invoice.client_name || invoice.nclient}</div>
            {fv(clientObj,'adresse','address') && <div>{fv(clientObj,'adresse','address')}</div>}
            {fv(clientObj,'telephone','tel','phone') && <div>Tél: {fv(clientObj,'telephone','tel','phone')}</div>}
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-color)' }}>
              {fv(clientObj,'nif','ident_fiscal') && <div><strong>NIF:</strong> {fv(clientObj,'nif','ident_fiscal')}</div>}
              {fv(clientObj,'rc','nrc') && <div><strong>RC:</strong> {fv(clientObj,'rc','nrc')}</div>}
              {fv(clientObj,'art','nart') && <div><strong>Art:</strong> {fv(clientObj,'art','nart')}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Tableau articles */}
      <div style={{ background: 'var(--card-background)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20, marginBottom: 20, overflowX: 'auto' }}>
        <h3 style={{ margin: '0 0 14px 0', color: 'var(--text-primary)', fontSize: 16 }}>📦 Articles facturés</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--primary-color)', color: 'white' }}>
              {['Réf','Désignation','Qté','P.U. HT','TVA','Total HT'].map((h,i) => (
                <th key={i} style={{ padding: '10px 12px', textAlign: i >= 2 ? 'right' : 'left', fontWeight: 700, fontSize: 13 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.details.length > 0 ? invoice.details.map((d, i) => (
              <tr key={i} style={{ background: i%2===0?'transparent':'var(--background-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '10px 12px', color: 'var(--text-tertiary)', fontSize: 13 }}>{d.narticle}</td>
                <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--text-primary)' }}>{d.designation}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>{d.qte}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>{(d.prix||0).toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>{d.tva}%</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>{(d.total_ligne||0).toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: 14 }}>Aucun détail disponible</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totaux */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <div style={{ minWidth: '340px', background: 'var(--card-background)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          {[
            { label: 'Montant HT', val: invoice.montant_ht },
            { label: 'TVA', val: invoice.tva },
            ...(invoice.timbre ? [{ label: 'Timbre fiscal', val: invoice.timbre }] : []),
          ].map((r,i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{r.label}</span>
              <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.val)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--primary-color)' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>NET À PAYER TTC</span>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '20px', fontVariantNumeric: 'tabular-nums' }}>{fmt(invoice.montant_ttc)}</span>
          </div>
        </div>
      </div>

      {/* Bouton impression */}
      <button onClick={openPrint} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg,#28a745,#20c997)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>
        🖨️ Imprimer la Facture (Bilingue FR/AR)
      </button>
    </div>
  );
}
