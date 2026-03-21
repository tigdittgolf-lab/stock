'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

interface FiscalSettings {
  tva_normal: number;
  tva_reduit: number;
  tap_rate: number;
  timbre_fiscal: number;
  ias_rate: number;
}

interface FiscalSummary {
  month: string;
  period: { start: string; end: string };
  sales: {
    ca_ht_factures: number;
    ca_ht_bl: number;
    ca_ht_total: number;
    tva_collectee: number;
    nb_factures: number;
    nb_bl: number;
  };
  purchases: {
    total_ht: number;
    tva_deductible: number;
    nb_factures: number;
  };
  tva: {
    collectee: number;
    deductible: number;
    nette_a_payer: number;
  };
  tap: { base: number };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function G50Page() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState<FiscalSummary | null>(null);
  const [settings, setSettings] = useState<FiscalSettings>({
    tva_normal: 19, tva_reduit: 9, tap_rate: 2, timbre_fiscal: 0.5, ias_rate: 0
  });
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
    fetchCompanyInfo();
  }, []);

  useEffect(() => {
    if (month) fetchSummary();
  }, [month]);

  const fetchSettings = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const res = await fetch('/api/fiscal/settings', { headers: { 'X-Tenant': tenant } });
      const data = await res.json();
      if (data.success && data.data) setSettings(prev => ({ ...prev, ...data.data }));
    } catch (e) {}
  };

  const fetchCompanyInfo = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const res = await fetch('/api/settings/activities', { headers: { 'X-Tenant': tenant } });
      const data = await res.json();
      if (data.success) setCompanyInfo(data.data);
    } catch (e) {}
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const res = await fetch(`/api/fiscal/summary?month=${month}`, {
        headers: { 'X-Tenant': tenant }
      });
      const data = await res.json();
      if (data.success) setSummary(data.data);
    } catch (e) {
      console.error('Error fetching fiscal summary:', e);
    } finally {
      setLoading(false);
    }
  };

  const tap_montant = summary ? (summary.tap.base * settings.tap_rate) / 100 : 0;
  const tva_nette = summary?.tva.nette_a_payer || 0;
  const total_a_payer = tva_nette + tap_montant;

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const { addArabicText, AR } = await import('@/lib/pdf-arabic');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const company = companyInfo || {};
    const [year, mon] = month.split('-');
    const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const monthLabel = `${monthNames[parseInt(mon) - 1]} ${year}`;

    // ── Header ──────────────────────────────────────────────────────────────
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉCLARATION G50', 60, 12, { align: 'center' });
    // Arabic title
    await addArabicText(doc, AR.declaration_g50, 110, 8, 90, { fontSize: 13, color: '#ffffff', align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Taxe sur la Valeur Ajoutée & Taxe sur l'Activité Professionnelle`, 105, 20, { align: 'center' });
    doc.text(`Période : ${monthLabel}`, 105, 26, { align: 'center' });
    // ── Company info ─────────────────────────────────────────────────────────
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(company.nom_entreprise || company.name || '', 14, 36);
    doc.setFont('helvetica', 'normal');
    doc.text(company.adresse || company.address || '', 14, 41);
    doc.text(`NIF: ${company.nif || '—'}   RC: ${company.rc || company.nrc || '—'}   Art: ${company.nart || '—'}`, 14, 46);

    // ── Section TVA ──────────────────────────────────────────────────────────
    let y = 56;
    const drawSectionTitle = (title: string, yy: number) => {
      doc.setFillColor(243, 244, 246);
      doc.rect(14, yy - 5, 182, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 64, 175);
      doc.text(title, 16, yy);
      doc.setTextColor(0, 0, 0);
    };

    const drawRow = (label: string, value: string, yy: number, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.text(label, 16, yy);
      doc.text(value, 196, yy, { align: 'right' });
      doc.setDrawColor(220, 220, 220);
      doc.line(14, yy + 2, 196, yy + 2);
    };

    drawSectionTitle('I. TAXE SUR LA VALEUR AJOUTÉE (TVA)', y);
    y += 10;
    drawRow('Chiffre d\'affaires HT — Factures', `${fmt(summary?.sales.ca_ht_factures || 0)} DA`, y); y += 8;
    drawRow('Chiffre d\'affaires HT — BL', `${fmt(summary?.sales.ca_ht_bl || 0)} DA`, y); y += 8;
    drawRow('CA HT Total (base TVA collectée)', `${fmt(summary?.sales.ca_ht_total || 0)} DA`, y, true); y += 8;
    drawRow('TVA collectée (ventes)', `${fmt(summary?.tva.collectee || 0)} DA`, y); y += 8;
    drawRow('TVA déductible (achats)', `- ${fmt(summary?.tva.deductible || 0)} DA`, y); y += 8;

    doc.setFillColor(254, 243, 199);
    doc.rect(14, y - 5, 182, 9, 'F');
    drawRow('TVA NETTE À PAYER', `${fmt(tva_nette)} DA`, y, true); y += 14;

    drawSectionTitle('II. TAXE SUR L\'ACTIVITÉ PROFESSIONNELLE (TAP)', y);
    y += 10;
    drawRow('Base CA HT', `${fmt(summary?.tap.base || 0)} DA`, y); y += 8;
    drawRow(`Taux TAP appliqué`, `${settings.tap_rate} %`, y); y += 8;

    doc.setFillColor(254, 243, 199);
    doc.rect(14, y - 5, 182, 9, 'F');
    drawRow('TAP À PAYER', `${fmt(tap_montant)} DA`, y, true); y += 14;

    // ── Total ────────────────────────────────────────────────────────────────
    doc.setFillColor(37, 99, 235);
    doc.rect(14, y - 5, 182, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL À PAYER (TVA + TAP)', 16, y + 2);
    doc.text(`${fmt(total_a_payer)} DA`, 196, y + 2, { align: 'right' });
    y += 18;

    // ── Stats ────────────────────────────────────────────────────────────────
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Documents traités : ${summary?.sales.nb_factures || 0} factures ventes, ${summary?.sales.nb_bl || 0} BL, ${summary?.purchases.nb_factures || 0} factures achats`, 14, y);
    y += 6;
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, y);

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('Document généré automatiquement — À vérifier avant dépôt officiel à la DGI', 105, 285, { align: 'center' });

    doc.save(`G50_${month}.pdf`);
  };

  const cardStyle = {
    background: '#fff',
    borderRadius: 10,
    padding: '16px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
  };

  return (
    <div className={styles.container}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/fiscal')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>←</button>
            <div>
              <h1 style={{ margin: 0, fontSize: 22 }}>Déclaration G50</h1>
              <p style={{ margin: 0, fontSize: 13, color: '#666' }}>TVA + TAP mensuelle</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}
            />
            <button
              onClick={exportPDF}
              disabled={!summary}
              style={{
                padding: '8px 18px',
                background: summary ? '#2563eb' : '#9ca3af',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: summary ? 'pointer' : 'not-allowed',
                fontSize: 14,
                fontWeight: 600
              }}
            >
              📄 Exporter PDF
            </button>
          </div>
        </div>

        {loading && <p style={{ textAlign: 'center', color: '#666' }}>Calcul en cours...</p>}

        {summary && (
          <>
            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
              {[
                { label: 'CA HT Total', value: fmt(summary.sales.ca_ht_total), unit: 'DA', color: '#2563eb' },
                { label: 'TVA Nette à payer', value: fmt(tva_nette), unit: 'DA', color: '#dc2626' },
                { label: 'TAP à payer', value: fmt(tap_montant), unit: 'DA', color: '#d97706' }
              ].map(card => (
                <div key={card.label} style={{ ...cardStyle, borderTop: `3px solid ${card.color}` }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>{card.label}</p>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: card.color }}>
                    {card.value} <span style={{ fontSize: 12, fontWeight: 400 }}>{card.unit}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* TVA Section */}
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, margin: '0 0 14px', color: '#1e40af' }}>I. TVA — Taxe sur la Valeur Ajoutée</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {[
                    ['CA HT Factures ventes', fmt(summary.sales.ca_ht_factures) + ' DA', false],
                    ['CA HT Bons de livraison', fmt(summary.sales.ca_ht_bl) + ' DA', false],
                    ['CA HT Total', fmt(summary.sales.ca_ht_total) + ' DA', true],
                    ['TVA collectée (ventes)', fmt(summary.tva.collectee) + ' DA', false],
                    ['TVA déductible (achats)', '− ' + fmt(summary.tva.deductible) + ' DA', false],
                  ].map(([label, value, bold]) => (
                    <tr key={label as string} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '7px 0', fontWeight: bold ? 600 : 400, color: '#374151' }}>{label}</td>
                      <td style={{ padding: '7px 0', textAlign: 'right', fontWeight: bold ? 600 : 400 }}>{value}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#fef3c7' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 700, color: '#92400e' }}>TVA NETTE À PAYER</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: '#92400e' }}>{fmt(tva_nette)} DA</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* TAP Section */}
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, margin: '0 0 14px', color: '#1e40af' }}>II. TAP — Taxe sur l'Activité Professionnelle</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {[
                    ['Base imposable (CA HT)', fmt(summary.tap.base) + ' DA', false],
                    [`Taux TAP (${settings.tap_rate}%)`, '', false],
                  ].map(([label, value, bold]) => (
                    <tr key={label as string} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '7px 0', color: '#374151' }}>{label}</td>
                      <td style={{ padding: '7px 0', textAlign: 'right' }}>{value}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#fef3c7' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 700, color: '#92400e' }}>TAP À PAYER</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: '#92400e' }}>{fmt(tap_montant)} DA</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div style={{ ...cardStyle, background: '#1e3a8a', color: '#fff', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>TOTAL À PAYER (TVA + TAP)</span>
                <span style={{ fontSize: 22, fontWeight: 700 }}>{fmt(total_a_payer)} DA</span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ ...cardStyle, background: '#f9fafb', fontSize: 12, color: '#6b7280' }}>
              Documents traités : {summary.sales.nb_factures} factures ventes · {summary.sales.nb_bl} BL · {summary.purchases.nb_factures} factures achats
              &nbsp;|&nbsp; Période : {summary.period.start} → {summary.period.end}
            </div>
          </>
        )}

        {!loading && !summary && (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
            Sélectionnez un mois pour calculer la déclaration G50
          </div>
        )}
      </div>
    </div>
  );
}
