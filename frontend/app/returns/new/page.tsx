'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface DocumentLine {
  narticle: string;
  designation: string;
  qte: number;
  prix: number;
  tva: number;
  total_ligne: number;
  qte_retour: number;
}

interface Document {
  id: number;
  nclient: string;
  client_name: string;
  date_fact: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  details: DocumentLine[];
}

const fmt = (n: number) => (Math.round((n || 0) * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' DA';

function NewReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Allow editing type and id if not provided via URL
  const [docType, setDocType] = useState<'bl' | 'invoice'>((searchParams.get('type') || 'bl') as 'bl' | 'invoice');
  const [docId, setDocId] = useState(searchParams.get('id') || '');

  const [document, setDocument] = useState<Document | null>(null);
  const [lines, setLines] = useState<DocumentLine[]>([]);
  const [motif, setMotif] = useState('');
  const [dateAvoir, setDateAvoir] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  // Auto-fetch if id provided via URL
  useEffect(() => {
    const urlId = searchParams.get('id');
    if (urlId) fetchDocument(urlId, (searchParams.get('type') || 'bl') as 'bl' | 'invoice');
  }, []);

  const fetchDocument = async (id?: string, type?: 'bl' | 'invoice') => {
    const useId = id || docId;
    const useType = type || docType;
    if (!useId) { setError('Veuillez saisir un numéro de document'); return; }

    setFetching(true);
    setError('');
    setDocument(null);
    setLines([]);
    try {
      const tenant = getTenant();
      const dbType = getDbType();
      const endpoint = useType === 'bl'
        ? `/api/sales/delivery-notes?id=${useId}`
        : `/api/sales/invoices?id=${useId}`;

      const res = await fetch(endpoint, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType }
      });
      const data = await res.json();

      if (data.success && data.data) {
        const doc = data.data;
        // BL returns detail_bl, invoices return detail_fact or details
        const rawDetails = doc.detail_bl || doc.detail_fact || doc.details || [];
        const details: DocumentLine[] = rawDetails.map((d: any) => ({
          narticle: d.narticle || d.Narticle || '',
          designation: d.designation || d.Designation || '',
          qte: parseFloat(d.qte || d.Qte || 0),
          prix: parseFloat(d.prix || d.Prix || 0),
          tva: parseFloat(d.tva || d.TVA || 19),
          total_ligne: parseFloat(d.total_ligne || d.Total_ligne || 0),
          qte_retour: 0
        }));
        const montant_ht = parseFloat(doc.montant_ht || 0);
        const tva = parseFloat(doc.tva || doc.montant_tva || 0);
        setDocument({
          id: doc.nfact || doc.nbl || parseInt(useId),
          nclient: doc.nclient || '',
          client_name: doc.client_name || doc.client?.raison_sociale || doc.nclient || '',
          date_fact: doc.date_fact || doc.date_bl || '',
          montant_ht,
          tva,
          montant_ttc: parseFloat(doc.montant_ttc || doc.total_ttc || 0) || (montant_ht + tva),
          details,
        });
        setLines(details);
        if (details.length === 0) setError('Aucun article trouvé dans ce document');
      } else {
        setError(data.error || 'Document introuvable');
      }
    } catch (e: any) {
      setError('Erreur de connexion: ' + e.message);
    } finally {
      setFetching(false);
    }
  };

  const setReturnQty = (index: number, qty: number) => {
    const updated = [...lines];
    updated[index].qte_retour = Math.min(Math.max(0, qty), updated[index].qte);
    setLines(updated);
  };

  const selectAll = () => setLines(lines.map(l => ({ ...l, qte_retour: l.qte })));
  const clearAll = () => setLines(lines.map(l => ({ ...l, qte_retour: 0 })));

  const returnLines = lines.filter(l => l.qte_retour > 0);
  const totals = returnLines.reduce((acc, l) => {
    const ht = l.qte_retour * l.prix;
    const tva = ht * (l.tva / 100);
    return { ht: acc.ht + ht, tva: acc.tva + tva, ttc: acc.ttc + ht + tva };
  }, { ht: 0, tva: 0, ttc: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (returnLines.length === 0) { setError('Sélectionnez au moins un article à retourner'); return; }
    if (!document) return;

    setLoading(true);
    setError('');
    try {
      const tenant = getTenant();
      const dbType = getDbType();
      const res = await fetch('/api/sales/credit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant': tenant, 'X-Database-Type': dbType },
        body: JSON.stringify({
          nclient: document.nclient,
          document_type: docType,
          document_ref: parseInt(docId),
          date_avoir: dateAvoir,
          motif,
          lines: returnLines.map(l => ({ narticle: l.narticle, qte: l.qte_retour, prix: l.prix, tva: l.tva }))
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`✅ ${data.message}`);
        setTimeout(() => router.push('/returns/list'), 2000);
      } else {
        setError(data.error || 'Erreur création avoir');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 20, background: 'var(--background)', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
        background: 'linear-gradient(135deg, #e74c3c, #c0392b)', borderRadius: 12, padding: '20px 24px', color: 'white' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>↩️ Nouveau Retour / Avoir</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>
            Retour sur {docType === 'bl' ? 'Bon de Livraison' : 'Facture'}{docId ? ` N° ${docId}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.push('/returns/list')}
            style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            📋 Liste Avoirs
          </button>
          <button onClick={() => router.back()}
            style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            ← Retour
          </button>
        </div>
      </div>

      {success && (
        <div style={{ padding: 16, background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 8, marginBottom: 20, color: 'var(--success-text)', fontWeight: 600, fontSize: 16 }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ padding: 16, background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 8, marginBottom: 20, color: 'var(--error-text)', fontWeight: 600 }}>
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Sélection document */}
        <div style={{ background: 'var(--card-background)', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>📋 Document d'origine</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)' }}>Type de document</label>
              <select value={docType} onChange={e => { setDocType(e.target.value as 'bl' | 'invoice'); setDocument(null); setLines([]); }}
                style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--border-color)', borderRadius: 8, fontSize: 14, background: 'var(--background-secondary)', color: 'var(--text-primary)' }}>
                <option value="bl">Bon de Livraison</option>
                <option value="invoice">Facture</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)' }}>N° Document</label>
              <input type="number" value={docId} onChange={e => setDocId(e.target.value)}
                placeholder="Ex: 3943"
                style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--border-color)', borderRadius: 8, fontSize: 14, background: 'var(--background-secondary)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)' }}>Date de l'avoir</label>
              <input type="date" value={dateAvoir} onChange={e => setDateAvoir(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--border-color)', borderRadius: 8, fontSize: 14, background: 'var(--background-secondary)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
            </div>
            <div>
              <button type="button" onClick={() => fetchDocument()} disabled={!docId || fetching}
                style={{ width: '100%', padding: '11px 16px', background: fetching ? 'var(--background-tertiary)' : 'linear-gradient(135deg,#e74c3c,#c0392b)',
                  color: fetching ? 'var(--text-tertiary)' : 'white', border: 'none', borderRadius: 8, cursor: fetching || !docId ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14 }}>
                {fetching ? '⏳ Chargement...' : '🔍 Charger le document'}
              </button>
            </div>
          </div>

          {document && (
            <div style={{ marginTop: 16, padding: 12, background: 'var(--info-bg)', borderRadius: 8, border: '1px solid var(--info-border)', fontSize: 14, color: 'var(--info-text)' }}>
              <strong>Client:</strong> {document.client_name || document.nclient} &nbsp;|&nbsp;
              <strong>Date:</strong> {document.date_fact ? new Date(document.date_fact).toLocaleDateString('fr-FR') : '—'} &nbsp;|&nbsp;
              <strong>Total TTC:</strong> {fmt(document.montant_ttc)}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)' }}>Motif du retour</label>
            <input type="text" value={motif} onChange={e => setMotif(e.target.value)}
              placeholder="Ex: Produit défectueux, erreur de commande..."
              style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--border-color)', borderRadius: 8, fontSize: 14, background: 'var(--background-secondary)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Section 2: Articles */}
        {!document && !fetching && (
          <div style={{ background: 'var(--card-background)', borderRadius: 12, padding: 40, marginBottom: 20, border: '2px dashed var(--border-color)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Saisissez un numéro de document et cliquez sur "Charger"</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Les articles du BL ou de la facture apparaîtront ici</div>
          </div>
        )}

        {lines.length > 0 && (
          <div style={{ background: 'var(--card-background)', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>📦 Articles à retourner</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={selectAll}
                  style={{ padding: '6px 14px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Tout retourner
                </button>
                <button type="button" onClick={clearAll}
                  style={{ padding: '6px 14px', background: 'var(--background-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Tout effacer
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--background-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                    {['Article','Désignation','Qté livrée','Prix','Qté retour','Montant avoir'].map((h,i) => (
                      <th key={i} style={{ padding: '10px 12px', textAlign: i >= 2 ? 'center' : 'left', fontSize: 13, fontWeight: 700, color: i === 4 ? '#e74c3c' : 'var(--text-primary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => {
                    const avoirHT = line.qte_retour * line.prix;
                    const avoirTTC = avoirHT * (1 + line.tva / 100);
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: line.qte_retour > 0 ? 'var(--error-bg)' : 'transparent' }}>
                        <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#e74c3c' }}>{line.narticle}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)' }}>{line.designation}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, color: 'var(--text-primary)' }}>{line.qte}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, color: 'var(--text-primary)' }}>{fmt(line.prix)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <input type="number" min={0} max={line.qte} value={line.qte_retour}
                            onChange={e => setReturnQty(i, parseInt(e.target.value) || 0)}
                            style={{ width: 70, padding: '6px 8px', border: `2px solid ${line.qte_retour > 0 ? '#e74c3c' : 'var(--border-color)'}`,
                              borderRadius: 6, textAlign: 'center', fontSize: 14, fontWeight: 700,
                              background: 'var(--background-secondary)', color: 'var(--text-primary)' }} />
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: line.qte_retour > 0 ? '#e74c3c' : 'var(--text-tertiary)' }}>
                          {line.qte_retour > 0 ? fmt(avoirTTC) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totaux avoir */}
            {returnLines.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ minWidth: 320, background: 'var(--card-background)', borderRadius: 10, overflow: 'hidden', border: '2px solid #e74c3c' }}>
                  {[
                    { label: 'Montant HT avoir', val: totals.ht },
                    { label: 'TVA avoir', val: totals.tva },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{r.label}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(r.val)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: '#e74c3c' }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Total TTC avoir</span>
                    <span style={{ color: 'white', fontWeight: 800, fontSize: 18 }}>{fmt(totals.ttc)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bouton soumettre */}
        {lines.length > 0 && (
          <button type="submit" disabled={loading || returnLines.length === 0}
            style={{ width: '100%', padding: '16px', background: loading || returnLines.length === 0 ? 'var(--background-tertiary)' : 'linear-gradient(135deg,#e74c3c,#c0392b)',
              color: loading || returnLines.length === 0 ? 'var(--text-tertiary)' : 'white',
              border: 'none', borderRadius: 10, cursor: loading || returnLines.length === 0 ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 700 }}>
            {loading ? '⏳ Création en cours...' : `↩️ Créer l'avoir (${returnLines.length} article${returnLines.length > 1 ? 's' : ''})`}
          </button>
        )}
      </form>
    </div>
  );
}

export default function NewReturnPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>⏳ Chargement...</div>}>
      <NewReturnContent />
    </Suspense>
  );
}
