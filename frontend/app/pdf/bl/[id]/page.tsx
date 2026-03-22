'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

export default function PDFGeneratorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const mode = searchParams.get('mode') || 'complet'; // complet | reduit | ticket
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

    let blData: any = null;
    let companyData: any = null;

    try {
      // 1. Charger BL + infos entreprise en parallèle
      const [blRes, companyRes] = await Promise.all([
        fetch(`/api/sales/delivery-notes?id=${id}`, {
          headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType }
        }),
        fetch(`/api/settings/activities`, { headers: { 'X-Tenant': tenant } })
      ]);

      const blJson = await blRes.json();
      if (!blJson.success) { setStatus(`❌ BL ${id} introuvable: ${blJson.error}`); return; }
      blData = blJson.data;

      const companyJson = companyRes.ok ? await companyRes.json() : null;
      if (companyJson?.success && companyJson.data?.length > 0) companyData = companyJson.data[0];

      // 2. Charger le nom du client si absent (vieille base: nclient = code, pas de raison_sociale dans bl)
      if (!blData.client_name && blData.nclient) {
        try {
          // Essayer Nclient (majuscule) puis nclient (minuscule)
          for (const col of ['Nclient', 'nclient']) {
            const r = await fetch(
              `${SUPA_URL}/rest/v1/client?${col}=eq.${blData.nclient}&select=Raison_sociale,raison_sociale,nom&limit=1`,
              { headers: supaHeaders(tenant) }
            );
            if (r.ok) {
              const rows = await r.json();
              if (rows?.[0]) {
                blData.client_name = rows[0].Raison_sociale || rows[0].raison_sociale || rows[0].nom || '';
                if (blData.client_name) break;
              }
            }
          }
        } catch { /* non critique */ }
      }

      // 3. Charger les désignations depuis table article si manquantes dans detail_bl
      const details: any[] = blData.detail_bl || blData.details || [];
      const missingDesig = details.filter(d => !d.designation || d.designation === '');
      if (missingDesig.length > 0) {
        try {
          // Charger tous les articles référencés en une seule requête
          const codes = [...new Set(missingDesig.map((d: any) => d.narticle).filter(Boolean))];
          if (codes.length > 0) {
            // Supabase: filtre IN avec narticle
            const inFilter = codes.map(c => `"${c}"`).join(',');
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
              // Appliquer les désignations
              details.forEach((d: any) => {
                if (!d.designation && d.narticle) {
                  d.designation = artMap[String(d.narticle)] || '';
                }
              });
            }
          }
        } catch { /* non critique */ }
      }
    } catch (e: any) {
      setStatus(`❌ Erreur chargement: ${e.message}`);
      return;
    }

    // Préparer les données normalisées
    const company = {
      name: companyData?.nom_entreprise || 'VOTRE ENTREPRISE',
      address: companyData?.adresse || '',
      phone: companyData?.telephone || companyData?.tel || companyData?.gsm || '',
      email: companyData?.email || '',
      nif: companyData?.nif || companyData?.ident_fiscal || '',
      rc: companyData?.rc || '',
      art: companyData?.art || '',
    };

    const bl = {
      nfact: blData.nfact || blData.nbl || parseInt(id),
      date_fact: blData.date_fact || blData.date_bl || blData.date || '',
      client: {
        raison_sociale: blData.client_name || blData.raison_sociale || blData.nom || String(blData.nclient || ''),
        adresse: blData.client?.adresse || blData.adresse_client || '',
      },
      montant_ht: parseFloat(blData.montant_ht?.toString() || '0') || 0,
      tva: parseFloat(blData.tva?.toString() || '0') || 0,
      montant_ttc: parseFloat(blData.montant_ttc?.toString() || '0') || 0,
      timbre: parseFloat(blData.timbre?.toString() || '0') || 0,
      detail_bl: (blData.detail_bl || blData.details || []).map((d: any) => ({
        narticle: String(d.narticle || d.article?.narticle || ''),
        designation: d.designation || d.article?.designation || '',
        qte: parseFloat(d.qte?.toString() || '0') || 0,
        prix: parseFloat(d.prix?.toString() || '0') || 0,
        tva: parseFloat(d.tva?.toString() || '0') || 0,
        total_ligne: parseFloat(d.total_ligne?.toString() || '0') || 0,
      })),
    };

    if (!bl.montant_ttc || bl.montant_ttc === 0) {
      bl.montant_ttc = bl.montant_ht + bl.tva + bl.timbre;
    }

    try {
      const { jsPDF } = await import('jspdf');

      // Formatage nombres: espace normal (pas insécable) pour jsPDF
      const fmt = (n: number) => {
        const s = (n || 0).toFixed(2);
        const [int, dec] = s.split('.');
        return int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + dec;
      };
      const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '';
      const fmtQty = (n: number) => n % 1 === 0 ? String(n) : n.toFixed(2);

      let doc: any;
      let filename = '';

      if (mode === 'ticket') {
        // ===== FORMAT TICKET 80mm =====
        doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 220] });
        let y = 10;
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text(company.name.substring(0, 30), 40, y, { align: 'center' }); y += 5;
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        if (company.phone) { doc.text(company.phone, 40, y, { align: 'center' }); y += 4; }
        y += 3;
        doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text(`Bon N: ${bl.nfact}`, 40, y, { align: 'center' }); y += 4;
        doc.setFont('helvetica', 'normal');
        doc.text(`Date: ${fmtDate(bl.date_fact)}`, 40, y, { align: 'center' }); y += 4;
        doc.text(`Client: ${bl.client.raison_sociale.substring(0, 25)}`, 40, y, { align: 'center' }); y += 6;
        doc.line(5, y, 75, y); y += 4;
        doc.setFontSize(7); doc.setFont('helvetica', 'bold');
        doc.text('Designation', 5, y);
        doc.text('Qte', 46, y, { align: 'right' });
        doc.text('P.U.', 60, y, { align: 'right' });
        doc.text('Total', 75, y, { align: 'right' });
        y += 3; doc.line(5, y, 75, y); y += 3;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
        bl.detail_bl.forEach((item: any) => {
          doc.text((item.designation || item.narticle).substring(0, 24), 5, y);
          doc.text(fmtQty(item.qte), 46, y, { align: 'right' });
          if (item.prix) doc.text(fmt(item.prix), 60, y, { align: 'right' });
          if (item.total_ligne) doc.text(fmt(item.total_ligne), 75, y, { align: 'right' });
          y += 4;
        });
        y += 2; doc.line(5, y, 75, y); y += 4;
        doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        if (bl.montant_ht > 0) { doc.text('HT:', 30, y); doc.text(fmt(bl.montant_ht), 75, y, { align: 'right' }); y += 4; }
        if (bl.tva > 0) { doc.text('TVA:', 30, y); doc.text(fmt(bl.tva), 75, y, { align: 'right' }); y += 4; }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
        doc.text('TOTAL TTC:', 20, y); doc.text(fmt(bl.montant_ttc), 75, y, { align: 'right' }); y += 8;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
        doc.text('Merci de votre visite', 40, y, { align: 'center' });
        filename = `ticket_${bl.nfact}.pdf`;

      } else if (mode === 'reduit') {
        // ===== FORMAT RÉDUIT A4 =====
        doc = new jsPDF();
        let y = 20;
        doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text(`Bon N: ${bl.nfact}`, 105, y, { align: 'center' }); y += 15;
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text(`Date: ${fmtDate(bl.date_fact)}`, 20, y);
        doc.text(`Client: ${bl.client.raison_sociale.substring(0, 30)}`, 110, y); y += 20;
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text('Code', 20, y); doc.text('Designation', 50, y);
        doc.text('Qte', 130, y, { align: 'center' });
        doc.text('P.U.', 158, y, { align: 'center' });
        doc.text('Total', 185, y, { align: 'center' });
        y += 2; doc.line(20, y, 190, y); y += 5;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        bl.detail_bl.forEach((item: any) => {
          if (y > 250) { doc.addPage(); y = 20; }
          doc.text(item.narticle.substring(0, 8), 20, y);
          doc.text((item.designation || '').substring(0, 22), 50, y);
          doc.text(fmtQty(item.qte), 133, y, { align: 'right' });
          if (item.prix) doc.text(fmt(item.prix), 163, y, { align: 'right' });
          if (item.total_ligne) doc.text(fmt(item.total_ligne), 190, y, { align: 'right' });
          y += 5;
        });
        y += 8;
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        if (bl.montant_ht > 0) { doc.text('Sous-total HT:', 120, y); doc.text(fmt(bl.montant_ht), 190, y, { align: 'right' }); y += 5; }
        if (bl.tva > 0) { doc.text('TVA:', 120, y); doc.text(fmt(bl.tva), 190, y, { align: 'right' }); y += 5; }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
        doc.text('TOTAL TTC:', 120, y); doc.text(fmt(bl.montant_ttc), 190, y, { align: 'right' });
        filename = `bl_reduit_${bl.nfact}.pdf`;

      } else {
        // ===== FORMAT COMPLET A4 =====
        doc = new jsPDF();
        let y = 20;
        doc.setFontSize(20); doc.setFont('helvetica', 'bold');
        doc.text('BON DE LIVRAISON', 105, y, { align: 'center' }); y += 10;
        doc.setLineWidth(0.5); doc.line(20, y, 190, y); y += 15;

        // Droite: N° + date + client
        let ry = y;
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text(`BL N: ${bl.nfact}`, 140, ry); ry += 5;
        doc.text(`Date: ${fmtDate(bl.date_fact)}`, 140, ry); ry += 8;
        doc.setFont('helvetica', 'bold'); doc.text('Client:', 140, ry); ry += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(bl.client.raison_sociale.substring(0, 25), 140, ry); ry += 5;
        if (bl.client.adresse) { doc.text(bl.client.adresse.substring(0, 25), 140, ry); ry += 5; }

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
        bl.detail_bl.forEach((item: any) => {
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
        doc.text('Sous-total HT:', 120, y); doc.text(fmt(bl.montant_ht), 190, y, { align: 'right' }); y += 6;
        doc.text('TVA:', 120, y); doc.text(fmt(bl.tva), 190, y, { align: 'right' }); y += 6;
        if (bl.timbre > 0) { doc.text('Timbre:', 120, y); doc.text(fmt(bl.timbre), 190, y, { align: 'right' }); y += 6; }
        y += 2;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
        doc.text('TOTAL TTC:', 120, y); doc.text(fmt(bl.montant_ttc), 190, y, { align: 'right' });

        // Montant en lettres
        y += 15;
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        doc.line(20, y - 5, 190, y - 5);
        doc.text('Arrete le present bon de livraison a la somme de :', 20, y); y += 12;
        const words = numberToWordsFr(bl.montant_ttc);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
        const bw = Math.min(doc.getTextWidth(words) + 16, 170);
        doc.rect(20, y - 10, bw, 16);
        doc.text(words, 28, y - 2, { maxWidth: 160 }); y += 18;

        // Signatures
        y += 10;
        doc.setFontSize(8); doc.setFont('helvetica', 'italic');
        doc.text('Note: Ce bon de livraison ne constitue pas une facture.', 20, y); y += 20;
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text('Signature Livreur:', 20, y); doc.text('Signature Client:', 130, y); y += 20;
        doc.line(20, y, 80, y); doc.line(130, y, 190, y);

        filename = `bl_${bl.nfact}.pdf`;
      }

      // Ouvrir dans le navigateur (pas de téléchargement automatique)
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
