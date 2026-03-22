'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

// Traductions arabes
const AR: Record<string, string> = {
  facture: 'فاتورة',
  bon_livraison: 'وصل التسليم',
  proforma: 'فاتورة مبدئية',
  avoir: 'إشعار دائن',
  designation: 'التسمية',
  quantite: 'الكمية',
  prix_unitaire: 'سعر الوحدة',
  tva: 'الرسم على القيمة المضافة',
  total: 'المجموع',
  reference: 'المرجع',
  montant_ht: 'المبلغ بدون رسم',
  montant_tva: 'مبلغ الرسم',
  montant_ttc: 'المبلغ الإجمالي',
  timbre: 'طابع مالي',
  net_a_payer: 'صافي المبلغ الواجب دفعه',
  client: 'الزبون',
  fournisseur: 'المورد',
  date: 'التاريخ',
  numero: 'الرقم',
  adresse: 'العنوان',
  telephone: 'الهاتف',
  nif: 'رقم التعريف الجبائي',
  rc: 'السجل التجاري',
  art: 'رقم المادة',
  signature_livreur: 'توقيع المسلِّم',
  signature_client: 'توقيع الزبون',
  note_bl: 'هذا الوصل لا يُعدّ فاتورة',
  arrete_somme: 'حُرِّر هذا المستند بمبلغ',
};

interface DocData {
  id: number;
  date: string;
  client?: { name: string; address?: string; nif?: string; rc?: string };
  company?: { name: string; address?: string; phone?: string; nif?: string; rc?: string; art?: string };
  items: Array<{ ref: string; designation: string; qty: number; prix: number; tva: number; total: number }>;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  timbre?: number;
}

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '';

export default function PrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const type = params.type as string; // bl | invoice | proforma | avoir
  const id = params.id as string;
  const lang = searchParams.get('lang') || 'bilingual'; // fr | ar | bilingual

  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getTenant = () => {
    if (typeof window === 'undefined') return '2025_bu01';
    // Priorité 1 : tenant dans l'URL (?tenant=...)
    const urlTenant = searchParams.get('tenant');
    if (urlTenant) return urlTenant;
    // Priorité 2 : localStorage
    const ti = localStorage.getItem('tenant_info');
    if (ti) { try { return JSON.parse(ti).schema; } catch {} }
    return localStorage.getItem('selectedTenant') || '2025_bu01';
  };

  useEffect(() => {
    fetchDoc();
  }, [type, id]);

  const fetchDoc = async () => {
    setLoading(true);
    try {
      const tenant = getTenant();
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
      const headers = { 'X-Tenant': tenant, 'X-Database-Type': dbType };

      let apiUrl = '';
      if (type === 'bl') apiUrl = `/api/sales/delivery-notes?id=${id}`;
      else if (type === 'invoice') apiUrl = `/api/sales/invoices?id=${id}`;
      else if (type === 'proforma') apiUrl = `/api/sales/proforma/${id}`;
      else if (type === 'avoir') apiUrl = `/api/sales/credit-notes/${id}`;
      else { setError('Type de document inconnu'); setLoading(false); return; }

      const res = await fetch(apiUrl, { headers });
      const data = await res.json();

      if (!data.success) { setError(data.error || 'Erreur chargement'); setLoading(false); return; }

      const raw = data.data;
      // Normaliser selon le type
      const normalized: DocData = {
        id: raw.nfact || raw.nbl || raw.id || parseInt(id),
        date: raw.date_fact || raw.date_bl || raw.date || '',
        client: {
          name: raw.client?.raison_sociale || raw.client?.nom || raw.nclient || '',
          address: raw.client?.adresse || '',
          nif: raw.client?.nif || '',
          rc: raw.client?.rc || '',
        },
        company: raw.company || raw.entreprise || undefined,
        items: (raw.detail_fact || raw.detail_bl || raw.details || []).map((it: any) => ({
          ref: it.article?.narticle || it.narticle || it.ref || '',
          designation: it.article?.designation || it.designation || '',
          qty: parseFloat(it.qte || it.qty || 0),
          prix: parseFloat(it.prix || it.prix_unitaire || 0),
          tva: parseFloat(it.tva || 0),
          total: parseFloat(it.total_ligne || it.total || 0),
        })),
        montant_ht: parseFloat(raw.montant_ht || 0),
        montant_tva: parseFloat(raw.tva || raw.montant_tva || 0),
        montant_ttc: parseFloat(raw.montant_ttc || raw.total_ttc || 0),
        timbre: parseFloat(raw.timbre || 0),
      };

      setDoc(normalized);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const docTitle = () => {
    if (type === 'bl') return { fr: 'BON DE LIVRAISON', ar: AR.bon_livraison };
    if (type === 'invoice') return { fr: 'FACTURE', ar: AR.facture };
    if (type === 'proforma') return { fr: 'FACTURE PROFORMA', ar: AR.proforma };
    if (type === 'avoir') return { fr: 'AVOIR / RETOUR', ar: AR.avoir };
    return { fr: '', ar: '' };
  };

  const showAr = lang === 'ar' || lang === 'bilingual';
  const showFr = lang === 'fr' || lang === 'bilingual';
  const title = docTitle();

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>⏳ Chargement...</div>;
  if (error) return <div style={{ padding: 40, color: 'red', fontFamily: 'sans-serif' }}>❌ {error}</div>;
  if (!doc) return null;

  return (
    <>
      {/* Barre d'outils (masquée à l'impression) */}
      <div className="no-print" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: '#1a1a2e', color: 'white', padding: '10px 20px',
        display: 'flex', gap: 12, alignItems: 'center', fontFamily: 'sans-serif'
      }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>🖨️ Impression</span>
        <span style={{ color: '#aaa', fontSize: 13 }}>{title.fr} #{doc.id}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <a href={`?lang=fr`} style={{ padding: '6px 14px', background: lang === 'fr' ? '#3498db' : '#444', color: 'white', borderRadius: 6, textDecoration: 'none', fontSize: 13 }}>🇫🇷 Français</a>
          <a href={`?lang=ar`} style={{ padding: '6px 14px', background: lang === 'ar' ? '#3498db' : '#444', color: 'white', borderRadius: 6, textDecoration: 'none', fontSize: 13 }}>🇩🇿 عربي</a>
          <a href={`?lang=bilingual`} style={{ padding: '6px 14px', background: lang === 'bilingual' ? '#3498db' : '#444', color: 'white', borderRadius: 6, textDecoration: 'none', fontSize: 13 }}>🔀 Bilingue</a>
          <button onClick={() => window.print()} style={{ padding: '6px 18px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>🖨️ Imprimer</button>
          <button onClick={() => window.history.back()} style={{ padding: '6px 14px', background: '#555', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>← Retour</button>
        </div>
      </div>

      {/* Document imprimable */}
      <div style={{ paddingTop: 60, fontFamily: 'Arial, Tahoma, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', padding: '30px 40px', boxShadow: '0 2px 20px rgba(0,0,0,0.1)' }}>

          {/* Titre bilingue */}
          <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '3px double #333', paddingBottom: 16 }}>
            {showFr && <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>{title.fr}</div>}
            {showAr && <div style={{ fontSize: 22, fontWeight: 700, direction: 'rtl', fontFamily: 'Tahoma, Arial', color: '#1a1a2e', marginTop: showFr ? 4 : 0 }}>{title.ar}</div>}
          </div>

          {/* Infos doc + client */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Entreprise (gauche) */}
            <div style={{ fontSize: 12, lineHeight: 1.8 }}>
              {doc.company && <>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{doc.company.name}</div>
                {doc.company.address && <div>{doc.company.address}</div>}
                {doc.company.phone && <div>Tél: {doc.company.phone}</div>}
                {doc.company.nif && <div>NIF: {doc.company.nif}</div>}
                {doc.company.rc && <div>RC: {doc.company.rc}</div>}
                {doc.company.art && <div>Art: {doc.company.art}</div>}
              </>}
            </div>

            {/* Client + N° doc (droite) */}
            <div style={{ fontSize: 12, lineHeight: 1.8, textAlign: 'right' }}>
              <div style={{ fontWeight: 700 }}>
                {showFr && 'N°: '}{showAr && <span style={{ direction: 'rtl', fontFamily: 'Tahoma' }}> :{AR.numero}</span>}
                <span style={{ fontSize: 16, fontWeight: 700 }}>{doc.id}</span>
              </div>
              <div>
                {showFr && `Date: ${fmtDate(doc.date)}`}
                {showAr && <span style={{ direction: 'rtl', fontFamily: 'Tahoma', display: 'block' }}>{fmtDate(doc.date)} :{AR.date}</span>}
              </div>
              {doc.client && <>
                <div style={{ marginTop: 8, fontWeight: 700 }}>
                  {showFr && 'Client: '}{showAr && <span style={{ direction: 'rtl', fontFamily: 'Tahoma' }}> :{AR.client}</span>}
                </div>
                <div style={{ fontWeight: 600 }}>{doc.client.name}</div>
                {doc.client.address && <div style={{ color: '#555' }}>{doc.client.address}</div>}
                {doc.client.nif && <div>NIF: {doc.client.nif}</div>}
                {doc.client.rc && <div>RC: {doc.client.rc}</div>}
              </>}
            </div>
          </div>

          {/* Tableau articles */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
            <thead>
              <tr style={{ background: '#1a1a2e', color: 'white' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', width: '8%' }}>
                  {showFr && 'Réf'}{showAr && <span style={{ direction: 'rtl', fontFamily: 'Tahoma', display: 'block', fontSize: 11 }}>{AR.reference}</span>}
                </th>
                <th style={{ padding: '8px 10px', textAlign: 'left', width: '35%' }}>
                  {showFr && 'Désignation'}{showAr && <span style={{ direction: 'rtl', fontFamily: 'Tahoma', display: 'block', fontSize: 11 }}>{AR.designation}</span>}
                </th>
                <th style={{ padding: '8px 10px', textAlign: 'center', width: '10%' }}>
                  {showFr && 'Qté'}{showAr && <span style={{ direction: 'rtl', fontFamily: 'Tahoma', display: 'block', fontSize: 11 }}>{AR.quantite}</span>}
                </th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '15%' }}>
                  {showFr && 'P.U.'}{showAr && <span style={{ direction: 'rtl', fontFamily: 'Tahoma', display: 'block', fontSize: 11 }}>{AR.prix_unitaire}</span>}
                </th>
                <th style={{ padding: '8px 10px', textAlign: 'center', width: '10%' }}>
                  {showFr && 'TVA'}{showAr && <span style={{ direction: 'rtl', fontFamily: 'Tahoma', display: 'block', fontSize: 11 }}>{AR.tva}</span>}
                </th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '15%' }}>
                  {showFr && 'Total'}{showAr && <span style={{ direction: 'rtl', fontFamily: 'Tahoma', display: 'block', fontSize: 11 }}>{AR.total}</span>}
                </th>
              </tr>
            </thead>
            <tbody>
              {doc.items.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f8f9fa', borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '7px 10px', color: '#555' }}>{item.ref}</td>
                  <td style={{ padding: '7px 10px', fontWeight: 500 }}>{item.designation}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{fmt(item.prix)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'center' }}>{item.tva}%</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totaux */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <table style={{ fontSize: 12, minWidth: 280 }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 12px', color: '#555' }}>
                    {showFr && 'Montant HT'}
                    {showAr && <span style={{ direction: 'rtl', fontFamily: 'Tahoma', marginRight: 8 }}>{AR.montant_ht}</span>}
                  </td>
                  <td style={{ padding: '4px 12px', textAlign: 'right', fontWeight: 600 }}>{fmt(doc.montant_ht)} DA</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 12px', color: '#555' }}>
                    {showFr && 'TVA'}
                    {showAr && <span style={{ direction: 'rtl', fontFamily: 'Tahoma', marginRight: 8 }}>{AR.montant_tva}</span>}
                  </td>
                  <td style={{ padding: '4px 12px', textAlign: 'right', fontWeight: 600 }}>{fmt(doc.montant_tva)} DA</td>
                </tr>
                {(doc.timbre || 0) > 0 && <tr>
                  <td style={{ padding: '4px 12px', color: '#555' }}>
                    {showFr && 'Timbre'}
                    {showAr && <span style={{ direction: 'rtl', fontFamily: 'Tahoma', marginRight: 8 }}>{AR.timbre}</span>}
                  </td>
                  <td style={{ padding: '4px 12px', textAlign: 'right' }}>{fmt(doc.timbre || 0)} DA</td>
                </tr>}
                <tr style={{ background: '#1a1a2e', color: 'white' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, fontSize: 14 }}>
                    {showFr && 'TOTAL TTC'}
                    {showAr && <span style={{ direction: 'rtl', fontFamily: 'Tahoma', marginRight: 8, fontSize: 13 }}>{AR.montant_ttc}</span>}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: 14 }}>{fmt(doc.montant_ttc)} DA</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 40, paddingTop: 20, borderTop: '1px solid #ddd' }}>
            <div style={{ textAlign: 'center', fontSize: 12 }}>
              {showFr && <div>Signature Livreur</div>}
              {showAr && <div style={{ direction: 'rtl', fontFamily: 'Tahoma' }}>{AR.signature_livreur}</div>}
              <div style={{ marginTop: 40, borderTop: '1px solid #333', paddingTop: 4, color: '#999' }}>_______________</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 12 }}>
              {showFr && <div>Signature et Cachet Client</div>}
              {showAr && <div style={{ direction: 'rtl', fontFamily: 'Tahoma' }}>{AR.signature_client}</div>}
              <div style={{ marginTop: 40, borderTop: '1px solid #333', paddingTop: 4, color: '#999' }}>_______________</div>
            </div>
          </div>

          {type === 'bl' && (
            <div style={{ marginTop: 16, fontSize: 11, color: '#888', fontStyle: 'italic', textAlign: 'center' }}>
              {showFr && 'Note: Ce bon de livraison ne constitue pas une facture.'}
              {showAr && <div style={{ direction: 'rtl', fontFamily: 'Tahoma', marginTop: 4 }}>{AR.note_bl}</div>}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; background: white; }
          div[style*="paddingTop: 60"] { padding-top: 0 !important; background: white !important; }
          div[style*="boxShadow"] { box-shadow: none !important; }
        }
      `}</style>
    </>
  );
}
