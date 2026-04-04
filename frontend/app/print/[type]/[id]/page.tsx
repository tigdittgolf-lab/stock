'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

// ── Traductions arabes ─────────────────────────────────────────────────────
const AR: Record<string, string> = {
  facture: 'فاتورة', bon_livraison: 'وصل التسليم', proforma: 'فاتورة مبدئية', avoir: 'إشعار دائن',
  designation: 'التسمية', quantite: 'الكمية', prix_unitaire: 'سعر الوحدة',
  tva: 'الرسم على القيمة المضافة', total: 'المجموع', reference: 'المرجع',
  montant_ht: 'المبلغ بدون رسم', montant_tva: 'مبلغ الرسم', montant_ttc: 'المبلغ الإجمالي',
  timbre: 'طابع مالي', client: 'الزبون', date: 'التاريخ', numero: 'الرقم',
  adresse: 'العنوان', telephone: 'الهاتف', nif: 'رقم التعريف الجبائي',
  rc: 'السجل التجاري', art: 'رقم المادة الجبائية',
  signature_livreur: 'توقيع المسلِّم', signature_client: 'توقيع وختم الزبون',
  note_bl: 'هذا الوصل لا يُعدّ فاتورة',
  arrete_somme: 'حُرِّر هذا المستند بمبلغ',
  vendeur: 'البائع', acheteur: 'المشتري',
};

// ── Interfaces ─────────────────────────────────────────────────────────────
interface Company {
  name: string; address?: string; commune?: string; wilaya?: string;
  phone?: string; fax?: string; email?: string;
  nif?: string; rc?: string; art?: string; nis?: string;
  activite?: string;
}
interface Client {
  code: string; name: string; address?: string;
  phone?: string; nif?: string; rc?: string; art?: string;
}
interface DocData {
  id: number; date: string;
  client: Client; company: Company;
  items: Array<{ ref: string; designation: string; qty: number; prix: number; tva: number; total: number }>;
  montant_ht: number; montant_tva: number; montant_ttc: number; timbre?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '';
const findKey = (obj: any, ...names: string[]) => {
  const keys = Object.keys(obj);
  for (const n of names) {
    const k = keys.find(k => k.toLowerCase() === n.toLowerCase());
    if (k !== undefined && obj[k] !== null && obj[k] !== undefined && obj[k] !== '') return obj[k];
  }
  return '';
};

// ── Montant en lettres (Français) ──────────────────────────────────────────
function numberToWordsFr(n: number): string {
  if (!n || n <= 0) return 'Zéro Dinar';
  const u = ['','un','deux','trois','quatre','cinq','six','sept','huit','neuf',
    'dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
  const t = ['','','vingt','trente','quarante','cinquante','soixante','soixante','quatre-vingt','quatre-vingt'];
  function h(x: number): string {
    if (x === 0) return '';
    if (x < 20) return u[x];
    if (x < 100) {
      const d = Math.floor(x/10), r = x%10;
      if (d === 7 || d === 9) return t[d-1]+'-'+u[10+r];
      return t[d]+(r?(r===1&&d<8?' et un':'-'+u[r]):(d===8?'s':''));
    }
    const c = Math.floor(x/100), r = x%100;
    return (c>1?u[c]+' ':'')+'cent'+(r?(' '+h(r)):(c>1?'s':''));
  }
  const i = Math.floor(n), d = Math.round((n-i)*100);
  let r = '';
  if (i >= 1000000) r += h(Math.floor(i/1000000))+' million'+(Math.floor(i/1000000)>1?'s':'')+' ';
  if (i >= 1000) { const k=Math.floor((i%1000000)/1000); r += k===1?'mille ':k>1?h(k)+' mille ':''; }
  r += h(i%1000);
  r = r.trim()+' Dinar'+(i>1?'s':'');
  if (d > 0) r += ' et '+h(d)+' Centime'+(d>1?'s':'');
  return r.charAt(0).toUpperCase()+r.slice(1);
}

// ── Montant en lettres (Arabe) ─────────────────────────────────────────────
function numberToWordsAr(n: number): string {
  if (!n || n <= 0) return 'صفر دينار';
  const u = ['','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة',
    'عشرة','أحد عشر','اثنا عشر','ثلاثة عشر','أربعة عشر','خمسة عشر','ستة عشر',
    'سبعة عشر','ثمانية عشر','تسعة عشر'];
  const t = ['','','عشرون','ثلاثون','أربعون','خمسون','ستون','سبعون','ثمانون','تسعون'];
  function h(x: number): string {
    if (x === 0) return '';
    if (x < 20) return u[x];
    if (x < 100) { const d=Math.floor(x/10),r=x%10; return t[d]+(r?' و'+u[r]:''); }
    const c=Math.floor(x/100),r=x%100;
    const cents=['','مئة','مئتان','ثلاثمئة','أربعمئة','خمسمئة','ستمئة','سبعمئة','ثمانمئة','تسعمئة'];
    return cents[c]+(r?' و'+h(r):'');
  }
  const i = Math.floor(n), d = Math.round((n-i)*100);
  let r = '';
  if (i >= 1000000) r += h(Math.floor(i/1000000))+' مليون ';
  if (i >= 1000) { const k=Math.floor((i%1000000)/1000); r += k===1?'ألف ':k===2?'ألفان ':k>2?h(k)+' آلاف ':''; }
  r += h(i%1000);
  r = r.trim()+' دينار';
  if (d > 0) r += ' و'+h(d)+' سنتيم';
  return r;
}

// ── Composant principal ────────────────────────────────────────────────────
export default function PrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const type = params.type as string;
  const id = params.id as string;
  const lang = searchParams.get('lang') || 'bilingual';

  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getTenant = () => {
    if (typeof window === 'undefined') return '2025_bu01';
    const urlTenant = searchParams.get('tenant');
    if (urlTenant) return urlTenant;
    const ti = localStorage.getItem('tenant_info');
    if (ti) { try { return JSON.parse(ti).schema; } catch {} }
    return localStorage.getItem('selectedTenant') || '2025_bu01';
  };

  useEffect(() => { fetchDoc(); }, [type, id]);

  const fetchDoc = async () => {
    setLoading(true);
    try {
      const tenant = getTenant();
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
      const headers = { 'X-Tenant': tenant, 'X-Database-Type': dbType };

      // 1. Charger le document
      let apiUrl = '';
      if (type === 'bl') apiUrl = `/api/sales/delivery-notes?id=${id}`;
      else if (type === 'invoice') apiUrl = `/api/sales/invoices?id=${id}`;
      else if (type === 'proforma') apiUrl = `/api/sales/proforma/${id}`;
      else if (type === 'avoir') apiUrl = `/api/sales/credit-notes/${id}`;
      else { setError('Type inconnu'); setLoading(false); return; }

      const [docRes, companyRes] = await Promise.all([
        fetch(apiUrl, { headers }),
        fetch('/api/settings/activities', { headers }),
      ]);

      const docData = await docRes.json();
      if (!docData.success) { setError(docData.error || 'Erreur'); setLoading(false); return; }

      const raw = docData.data;
      const nclient = raw.nclient || raw.Nclient || '';

      // 2. Charger les données complètes du client
      let clientFull: any = {};
      try {
        const clientRes = await fetch(`/api/sales/clients/${nclient}/debt`, { headers });
        const clientData = await clientRes.json();
        if (clientData.success && clientData.data) clientFull = clientData.data;
      } catch {}

      // 3. Données entreprise
      let company: Company = { name: '' };
      try {
        const compData = await companyRes.json();
        const arr = compData.success && Array.isArray(compData.data) ? compData.data : [];
        const c = arr.length > 0 ? arr[0] : (compData.success && !Array.isArray(compData.data) ? compData.data : {});
        company = {
          name: findKey(c,'nom_entreprise','name') || '',
          address: findKey(c,'adresse','address') || '',
          commune: findKey(c,'commune') || '',
          wilaya: findKey(c,'wilaya') || '',
          phone: findKey(c,'telephone','tel_fixe','phone') || '',
          fax: findKey(c,'fax') || '',
          email: findKey(c,'email','e_mail') || '',
          nif: findKey(c,'nif','ident_fiscal') || '',
          rc: findKey(c,'rc','nrc') || '',
          art: findKey(c,'art','nart') || '',
          nis: findKey(c,'nis') || '',
          activite: findKey(c,'activite','sous_domaine','domaine_activite') || '',
        };
      } catch {}

      // 4. Normaliser les lignes
      const items = (raw.detail_fact || raw.detail_bl || raw.details || []).map((it: any) => {
        const qty = parseFloat(it.qte || it.qty || 0);
        const prix = parseFloat(it.prix || it.prix_unitaire || 0);
        const storedTotal = parseFloat(it.total_ligne || it.total || 0);
        return {
          ref: it.article?.narticle || it.narticle || it.ref || '',
          designation: it.article?.designation || it.designation || '',
          qty, prix,
          tva: parseFloat(it.tva || 0),
          total: storedTotal || (qty * prix),
        };
      });

      const calcHT = items.reduce((s: number, it: any) => s + (it.qty * it.prix), 0);
      const calcTVA = items.reduce((s: number, it: any) => s + (it.qty * it.prix * it.tva / 100), 0);

      const normalized: DocData = {
        id: raw.nfact || raw.nbl || raw.id || parseInt(id),
        date: raw.date_fact || raw.date_bl || raw.date || '',
        company,
        client: {
          code: nclient,
          name: clientFull.raison_sociale || raw.client_name || raw.client?.raison_sociale || nclient,
          address: clientFull.adresse || raw.client?.adresse || '',
          phone: clientFull.telephone || raw.client?.telephone || '',
          nif: clientFull.nif || raw.client?.nif || '',
          rc: clientFull.rc || clientFull.nrc || raw.client?.rc || '',
          art: clientFull.art || clientFull.nart || raw.client?.art || '',
        },
        items,
        montant_ht: parseFloat(raw.montant_ht || 0) || calcHT,
        montant_tva: parseFloat(raw.tva || raw.montant_tva || 0) || calcTVA,
        montant_ttc: parseFloat(raw.montant_ttc || raw.total_ttc || 0) || (calcHT + calcTVA),
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

  // ── Bloc info entreprise ──
  const CompanyBlock = ({ align }: { align: 'left' | 'right' }) => (
    <div style={{ fontSize: 11, lineHeight: 1.9, textAlign: align }}>
      <div style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', marginBottom: 2 }}>{doc.company.name}</div>
      {doc.company.activite && <div style={{ fontStyle: 'italic', color: '#555', fontSize: 10 }}>{doc.company.activite}</div>}
      {doc.company.address && <div>{doc.company.address}{doc.company.commune ? ', '+doc.company.commune : ''}{doc.company.wilaya ? ' - '+doc.company.wilaya : ''}</div>}
      {doc.company.phone && <div>Tél: {doc.company.phone}{doc.company.fax ? ' / Fax: '+doc.company.fax : ''}</div>}
      {doc.company.email && <div>Email: {doc.company.email}</div>}
      <div style={{ marginTop: 4, borderTop: '1px solid #ccc', paddingTop: 4 }}>
        {doc.company.nif && <div><strong>NIF:</strong> {doc.company.nif}</div>}
        {doc.company.rc && <div><strong>RC:</strong> {doc.company.rc}</div>}
        {doc.company.art && <div><strong>Art:</strong> {doc.company.art}</div>}
        {doc.company.nis && <div><strong>NIS:</strong> {doc.company.nis}</div>}
      </div>
    </div>
  );

  // ── Bloc info client ──
  const ClientBlock = ({ align }: { align: 'left' | 'right' }) => (
    <div style={{ fontSize: 11, lineHeight: 1.9, textAlign: align }}>
      <div style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', marginBottom: 2 }}>{doc.client.name}</div>
      {doc.client.address && <div>{doc.client.address}</div>}
      {doc.client.phone && <div>Tél: {doc.client.phone}</div>}
      <div style={{ marginTop: 4, borderTop: '1px solid #ccc', paddingTop: 4 }}>
        {doc.client.nif && <div><strong>NIF:</strong> {doc.client.nif}</div>}
        {doc.client.rc && <div><strong>RC:</strong> {doc.client.rc}</div>}
        {doc.client.art && <div><strong>Art:</strong> {doc.client.art}</div>}
      </div>
    </div>
  );

  return (
    <>
      {/* Barre d'outils */}
      <div className="no-print" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: '#1a1a2e', color: 'white', padding: '8px 20px',
        display: 'flex', gap: 10, alignItems: 'center', fontFamily: 'sans-serif', fontSize: 13
      }}>
        <span style={{ fontWeight: 700 }}>🖨️ {title.fr} #{doc.id}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <a href="?lang=fr" style={{ padding: '5px 12px', background: lang==='fr'?'#3498db':'#444', color: 'white', borderRadius: 5, textDecoration: 'none' }}>🇫🇷 Français</a>
          <a href="?lang=ar" style={{ padding: '5px 12px', background: lang==='ar'?'#3498db':'#444', color: 'white', borderRadius: 5, textDecoration: 'none' }}>🇩🇿 عربي</a>
          <a href="?lang=bilingual" style={{ padding: '5px 12px', background: lang==='bilingual'?'#3498db':'#444', color: 'white', borderRadius: 5, textDecoration: 'none' }}>🔀 Bilingue</a>
          <button onClick={() => window.print()} style={{ padding: '5px 16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 700 }}>🖨️ Imprimer</button>
          <button onClick={() => window.history.back()} style={{ padding: '5px 12px', background: '#555', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' }}>← Retour</button>
        </div>
      </div>

      <div style={{ paddingTop: 56, fontFamily: 'Arial, Tahoma, sans-serif', background: '#eee', minHeight: '100vh' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', background: 'white', padding: '28px 36px', boxShadow: '0 2px 20px rgba(0,0,0,0.15)' }}>

          {/* ── EN-TÊTE : Entreprise gauche | Titre centre | N°/Date droite ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '3px double #1a1a2e' }}>
            {/* Entreprise */}
            <CompanyBlock align="left" />

            {/* Titre document */}
            <div style={{ textAlign: 'center', minWidth: 160 }}>
              {showFr && <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 2, color: '#1a1a2e' }}>{title.fr}</div>}
              {showAr && <div style={{ fontSize: 18, fontWeight: 800, direction: 'rtl', fontFamily: 'Tahoma', color: '#1a1a2e', marginTop: showFr ? 4 : 0 }}>{title.ar}</div>}
              <div style={{ marginTop: 12, fontSize: 11, color: '#333' }}>
                <div><strong>N°</strong> {doc.id}</div>
                {showAr && <div style={{ direction: 'rtl', fontFamily: 'Tahoma', fontSize: 11 }}>{AR.numero} : {doc.id}</div>}
                <div style={{ marginTop: 4 }}><strong>Date:</strong> {fmtDate(doc.date)}</div>
                {showAr && <div style={{ direction: 'rtl', fontFamily: 'Tahoma', fontSize: 11 }}>{AR.date} : {fmtDate(doc.date)}</div>}
              </div>
            </div>

            {/* Client */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#888', marginBottom: 4, textAlign: 'right' }}>
                {showFr && 'CLIENT / ACHETEUR'}
                {showAr && <span style={{ direction: 'rtl', fontFamily: 'Tahoma', display: 'block' }}>{AR.acheteur}</span>}
              </div>
              <div style={{ border: '1px solid #1a1a2e', borderRadius: 4, padding: '8px 10px' }}>
                <ClientBlock align="right" />
              </div>
            </div>
          </div>

          {/* ── TABLEAU ARTICLES ── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 16 }}>
            <thead>
              <tr style={{ background: '#1a1a2e', color: 'white' }}>
                {[
                  { fr: 'Réf', ar: AR.reference, w: '8%', align: 'left' as const },
                  { fr: 'Désignation', ar: AR.designation, w: '36%', align: 'left' as const },
                  { fr: 'Qté', ar: AR.quantite, w: '8%', align: 'center' as const },
                  { fr: 'P.U. HT', ar: AR.prix_unitaire, w: '14%', align: 'right' as const },
                  { fr: 'TVA', ar: AR.tva, w: '10%', align: 'center' as const },
                  { fr: 'Montant HT', ar: AR.total, w: '14%', align: 'right' as const },
                ].map((col, i) => (
                  <th key={i} style={{ padding: '7px 8px', textAlign: col.align, width: col.w, fontWeight: 700 }}>
                    {showFr && <div>{col.fr}</div>}
                    {showAr && <div style={{ direction: 'rtl', fontFamily: 'Tahoma', fontSize: 10, opacity: 0.9 }}>{col.ar}</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doc.items.map((item, i) => (
                <tr key={i} style={{ background: i%2===0?'white':'#f8f9fa', borderBottom: '1px solid #e8e8e8' }}>
                  <td style={{ padding: '6px 8px', color: '#555', fontSize: 10 }}>{item.ref}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 500 }}>{item.designation}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{fmt(item.prix)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>{item.tva}%</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{fmt(item.total)}</td>
                </tr>
              ))}
              {/* Lignes vides pour remplir */}
              {doc.items.length < 5 && Array.from({ length: 5 - doc.items.length }).map((_, i) => (
                <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #e8e8e8' }}>
                  {[0,1,2,3,4,5].map(j => <td key={j} style={{ padding: '6px 8px', height: 22 }}>&nbsp;</td>)}
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── TOTAUX ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <table style={{ fontSize: 11, minWidth: 300, border: '1px solid #ddd' }}>
              <tbody>
                {[
                  { fr: 'Montant HT', ar: AR.montant_ht, val: doc.montant_ht, bold: false },
                  { fr: 'TVA', ar: AR.montant_tva, val: doc.montant_tva, bold: false },
                  ...(doc.timbre ? [{ fr: 'Timbre fiscal', ar: AR.timbre, val: doc.timbre, bold: false }] : []),
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '5px 12px', color: '#555' }}>
                      {showFr && row.fr}
                      {showAr && <span style={{ direction: 'rtl', fontFamily: 'Tahoma', display: 'block' }}>{row.ar}</span>}
                    </td>
                    <td style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 600, minWidth: 100 }}>{fmt(row.val)} DA</td>
                  </tr>
                ))}
                <tr style={{ background: '#1a1a2e', color: 'white' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, fontSize: 13 }}>
                    {showFr && 'NET À PAYER TTC'}
                    {showAr && <span style={{ direction: 'rtl', fontFamily: 'Tahoma', display: 'block', fontSize: 12 }}>{AR.montant_ttc}</span>}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, fontSize: 13 }}>{fmt(doc.montant_ttc)} DA</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── MONTANT EN LETTRES ── */}
          {doc.montant_ttc > 0 && (
            <div style={{ border: '1px solid #1a1a2e', borderRadius: 4, padding: '10px 14px', marginBottom: 20, background: '#f9f9f9' }}>
              {showFr && (
                <div style={{ fontSize: 11, marginBottom: showAr ? 6 : 0 }}>
                  <span style={{ color: '#555' }}>Arrêté la présente facture à la somme de : </span>
                  <strong style={{ color: '#1a1a2e' }}>{numberToWordsFr(doc.montant_ttc)}</strong>
                </div>
              )}
              {showAr && (
                <div style={{ direction: 'rtl', fontFamily: 'Tahoma', fontSize: 12, color: '#1a1a2e' }}>
                  <span style={{ color: '#555' }}>{AR.arrete_somme} : </span>
                  <strong>{numberToWordsAr(doc.montant_ttc)}</strong>
                </div>
              )}
            </div>
          )}

          {/* ── SIGNATURES ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 24, paddingTop: 16, borderTop: '1px solid #ddd' }}>
            <div style={{ textAlign: 'center', fontSize: 11 }}>
              {showFr && <div style={{ fontWeight: 600 }}>Signature et Cachet Vendeur</div>}
              {showAr && <div style={{ direction: 'rtl', fontFamily: 'Tahoma', fontWeight: 600 }}>{AR.signature_livreur}</div>}
              <div style={{ marginTop: 50, borderTop: '1px solid #555' }}></div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 11 }}>
              {showFr && <div style={{ fontWeight: 600 }}>Signature et Cachet Client</div>}
              {showAr && <div style={{ direction: 'rtl', fontFamily: 'Tahoma', fontWeight: 600 }}>{AR.signature_client}</div>}
              <div style={{ marginTop: 50, borderTop: '1px solid #555' }}></div>
            </div>
          </div>

          {type === 'bl' && (
            <div style={{ marginTop: 14, fontSize: 10, color: '#888', fontStyle: 'italic', textAlign: 'center' }}>
              {showFr && 'Ce bon de livraison ne constitue pas une facture.'}
              {showAr && <div style={{ direction: 'rtl', fontFamily: 'Tahoma', marginTop: 2 }}>{AR.note_bl}</div>}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; background: white; }
          div[style*="paddingTop: 56"] { padding-top: 0 !important; background: white !important; }
          div[style*="boxShadow"] { box-shadow: none !important; }
          div[style*="background: #eee"] { background: white !important; }
        }
      `}</style>
    </>
  );
}
