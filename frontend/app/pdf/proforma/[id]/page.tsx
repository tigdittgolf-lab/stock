'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

export default function ProformaPDFPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const tenantParam = searchParams.get('tenant');
  const generated = useRef(false);
  const [status, setStatus] = useState('⏳ Génération du PDF en cours...');

  useEffect(() => {
    if (generated.current) return;
    generated.current = true;
    generate();
  }, []);

  const getTenant = () => {
    if (tenantParam) return tenantParam;
    const ti = localStorage.getItem('tenant_info');
    if (ti) { try { return JSON.parse(ti).schema; } catch {} }
    return localStorage.getItem('selectedTenant') || '2025_bu01';
  };

  const generate = async () => {
    const tenant = getTenant();
    const dbConfig = localStorage.getItem('activeDbConfig');
    const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
    const SUPA_URL = 'https://szgodrjglbpzkrksnroi.supabase.co';
    const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supaHeaders = (schema: string) => ({
      'apikey': SUPA_KEY,
      'Authorization': `Bearer ${SUPA_KEY}`,
      'Accept-Profile': schema,
      'Accept': 'application/json',
    });

    let pfData: any = null;
    let companyData: any = null;

    try {
      const [pfRes, companyRes] = await Promise.all([
        fetch(`/api/sales/proforma?id=${id}`, {
          headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType }
        }),
        fetch(`/api/settings/activities`, { headers: { 'X-Tenant': tenant } })
      ]);

      const pfJson = await pfRes.json();
      if (!pfJson.success) { setStatus(`❌ Proforma ${id} introuvable: ${pfJson.error}`); return; }
      pfData = pfJson.data;

      const companyJson = companyRes.ok ? await companyRes.json() : null;
      if (companyJson?.success && companyJson.data?.length > 0) companyData = companyJson.data[0];

      // Enrichir client_name si absent
      if (!pfData.client_name && pfData.nclient) {
        try {
          for (const col of ['Nclient', 'nclient']) {
            const r = await fetch(
              `${SUPA_URL}/rest/v1/client?${col}=eq.${pfData.nclient}&select=Raison_sociale,raison_sociale,nom&limit=1`,
              { headers: supaHeaders(tenant) }
            );
            if (r.ok) {
              const rows = await r.json();
              if (rows?.[0]) {
                pfData.client_name = rows[0].Raison_sociale || rows[0].raison_sociale || rows[0].nom || '';
                if (pfData.client_name) break;
              }
            }
          }
        } catch { /* non critique */ }
      }

      // Enrichir désignations si manquantes
      const details: any[] = pfData.detail_fact || pfData.details || [];
      const missingDesig = details.filter(d => !d.designation || d.designation === '');
      if (missingDesig.length > 0) {
        try {
          const codes = [...new Set(missingDesig.map((d: any) => d.narticle).filter(Boolean))];
          if (codes.length > 0) {
            const artRes = await fetch(
              `${SUPA_URL}/rest/v1/article?narticle=in.(${codes.join(',')})&select=narticle,Narticle,designation,Designation,libelle`,
              { headers: supaHeaders(tenant) }
            );
            if (artRes.ok) {
              const artRows = await artRes.json();
              const artMap: Record<string, string> = {};
              (artRows || []).forEach((a: any) => {
                const code = a.narticle || a.Narticle || '';
                const desig = a.designation || a.Designation || a.libelle || '';
                if (code) artMap[String(code)] = desig;
              });
              details.forEach((d: any) => {
                if (!d.designation && d.narticle) d.designation = artMap[String(d.narticle)] || '';
              });
            }
          }
        } catch { /* non critique */ }
      }
    } catch (e: any) {
      setStatus(`❌ Erreur chargement: ${e.message}`);
      return;
    }

    const company = {
      name: companyData?.nom_entreprise || 'VOTRE ENTREPRISE',
      address: companyData?.adresse || '',
      phone: companyData?.telephone || companyData?.tel || companyData?.gsm || '',
      email: companyData?.email || '',
      nif: companyData?.nif || companyData?.ident_fiscal || '',
      rc: companyData?.rc || '',
      art: companyData?.art || '',
    };

    const pf = {
      nfact: pfData.nfact || parseInt(id),
      date_fact: pfData.date_fact || pfData.date || '',
      client: {
        raison_sociale: pfData.client_name || pfData.raison_sociale || String(pfData.nclient || ''),
        adresse: pfData.adresse_client || '',
      },
      montant_ht: parseFloat(pfData.montant_ht?.toString() || '0') || 0,
      tva: parseFloat(pfData.tva?.toString() || '0') || 0,
      montant_ttc: parseFloat((pfData.montant_ttc || pfData.total_ttc)?.toString() || '0') || 0,
      timbre: parseFloat(pfData.timbre?.toString() || '0') || 0,
      details: (pfData.detail_fact || pfData.details || []).map((d: any) => ({
        narticle: String(d.narticle || ''),
        designation: d.designation || '',
        qte: parseFloat(d.qte?.toString() || '0') || 0,
        prix: parseFloat(d.prix?.toString() || '0') || 0,
        tva: parseFloat(d.tva?.toString() || '0') || 0,
        total_ligne: parseFloat(d.total_ligne?.toString() || '0') || 0,
      })),
    };

    if (!pf.montant_ttc) pf.montant_ttc = pf.montant_ht + pf.tva + pf.timbre;

    try {
      const { jsPDF } = await import('jspdf');

      const fmt = (n: number) => {
        const s = (n || 0).toFixed(2);
        const [int, dec] = s.split('.');
        return int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + dec;
      };
      const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '';
      const fmtQty = (n: number) => n % 1 === 0 ? String(n) : n.toFixed(2);

      const doc = new jsPDF();
      let y = 20;

      // Titre
      doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.text('FACTURE PROFORMA', 105, y, { align: 'center' }); y += 10;
      doc.setLineWidth(0.5); doc.line(20, y, 190, y); y += 15;

      // Droite: N° + date + client
      let ry = y;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`Proforma N: ${pf.nfact}`, 140, ry); ry += 5;
      doc.text(`Date: ${fmtDate(pf.date_fact)}`, 140, ry); ry += 8;
      doc.setFont('helvetica', 'bold'); doc.text('Client:', 140, ry); ry += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(pf.client.raison_sociale.substring(0, 25), 140, ry); ry += 5;
      if (pf.client.adresse) { doc.text(pf.client.adresse.substring(0, 25), 140, ry); ry += 5; }

      // Gauche: entreprise
      y = 45;
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text(company.name.substring(0, 35), 20, y); y += 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      if (company.address) { doc.text(company.address.substring(0, 45), 20, y); y += 5; }
      if (company.phone) { doc.text(`Tel: ${company.phone}`, 20, y); y += 5; }
      if (company.email) { doc.text(`Email: ${company.email.substring(0, 35)}`, 20, y); y += 5; }
      if (company.nif) { doc.text(`NIF: ${company.nif}`, 20, y); y += 5; }
      if (company.rc) { doc.text(`RC: ${company.rc}`, 20, y); y += 5; }
      if (company.art) { doc.text(`Art: ${company.art}`, 20, y); y += 5; }

      y = Math.max(y + 15, ry + 10);

      // Tableau
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text('Code', 20, y); doc.text('Designation', 48, y);
      doc.text('Qte', 108, y, { align: 'center' });
      doc.text('P.U.', 133, y, { align: 'center' });
      doc.text('TVA', 158, y, { align: 'center' });
      doc.text('Total', 185, y, { align: 'center' });
      y += 2; doc.line(20, y, 190, y); y += 5;

      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      pf.details.forEach((item: any) => {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.text(item.narticle.substring(0, 8), 20, y);
        doc.text((item.designation || '').substring(0, 26), 48, y);
        doc.text(fmtQty(item.qte), 111, y, { align: 'right' });
        if (item.prix) doc.text(fmt(item.prix), 143, y, { align: 'right' });
        if (item.tva) doc.text(`${item.tva}%`, 163, y, { align: 'right' });
        if (item.total_ligne) doc.text(fmt(item.total_ligne), 190, y, { align: 'right' });
        y += 6;
      });

      // Totaux
      y += 8;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text('Sous-total HT:', 120, y); doc.text(fmt(pf.montant_ht), 190, y, { align: 'right' }); y += 6;
      doc.text('TVA:', 120, y); doc.text(fmt(pf.tva), 190, y, { align: 'right' }); y += 6;
      if (pf.timbre > 0) { doc.text('Timbre:', 120, y); doc.text(fmt(pf.timbre), 190, y, { align: 'right' }); y += 6; }
      y += 2;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text('TOTAL TTC:', 120, y); doc.text(fmt(pf.montant_ttc), 190, y, { align: 'right' });

      // Montant en lettres
      y += 15;
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.line(20, y - 5, 190, y - 5);
      doc.text('Arrete le present devis a la somme de :', 20, y); y += 12;
      const words = numberToWordsFr(pf.montant_ttc);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      const bw = Math.min(doc.getTextWidth(words) + 16, 170);
      doc.rect(20, y - 10, bw, 16);
      doc.text(words, 28, y - 2, { maxWidth: 160 }); y += 18;

      // Note proforma
      y += 5;
      doc.setFontSize(8); doc.setFont('helvetica', 'italic');
      doc.text('Ce document est un devis proforma et ne constitue pas une facture definitive.', 20, y); y += 15;

      // Signatures
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text('Signature Vendeur:', 20, y); doc.text('Signature Client:', 130, y); y += 20;
      doc.line(20, y, 80, y); doc.line(130, y, 190, y);

      const blobUrl = doc.output('bloburl');
      window.location.href = blobUrl;

    } catch (e: any) {
      setStatus(`❌ Erreur PDF: ${e.message}`);
    }
  };

  return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 18, marginBottom: 16 }}>{status}</div>
      {status.startsWith('❌') && (
        <button onClick={() => window.history.back()} style={{ marginTop: 16, padding: '8px 20px', cursor: 'pointer' }}>
          ← Retour
        </button>
      )}
    </div>
  );
}

function numberToWordsFr(n: number): string {
  if (!n || n === 0) return 'Zero Dinars';
  const units = ['', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf',
    'Dix', 'Onze', 'Douze', 'Treize', 'Quatorze', 'Quinze', 'Seize', 'Dix-Sept', 'Dix-Huit', 'Dix-Neuf'];
  const tens = ['', '', 'Vingt', 'Trente', 'Quarante', 'Cinquante', 'Soixante', 'Soixante', 'Quatre-Vingt', 'Quatre-Vingt'];
  function h(num: number): string {
    if (num === 0) return '';
    if (num < 20) return units[num];
    if (num < 100) {
      const t = Math.floor(num / 10), u = num % 10;
      if (t === 7 || t === 9) return tens[t] + (u > 0 ? '-' + units[10 + u] : (t === 8 ? 's' : ''));
      return tens[t] + (u > 0 ? '-' + units[u] : (t === 8 ? 's' : ''));
    }
    const c = Math.floor(num / 100), r = num % 100;
    return (c > 1 ? units[c] + ' ' : '') + 'Cent' + (r > 0 ? ' ' + h(r) : (c > 1 ? 's' : ''));
  }
  const i = Math.floor(n), d = Math.round((n - i) * 100);
  let r = '';
  if (i >= 1000000) r += h(Math.floor(i / 1000000)) + ' Million' + (Math.floor(i / 1000000) > 1 ? 's' : '') + ' ';
  if (i >= 1000) { const t = Math.floor((i % 1000000) / 1000); r += t === 1 ? 'Mille ' : t > 1 ? h(t) + ' Mille ' : ''; }
  r += h(i % 1000);
  r = r.trim() + ' Dinars';
  if (d > 0) r += ' et ' + h(d) + ' Centimes';
  return r;
}
