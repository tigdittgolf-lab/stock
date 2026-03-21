'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getApiUrl } from '@/lib/api';

interface DocumentLine {
  narticle: string;
  designation: string;
  qte: number;
  prix: number;
  tva: number;
  total_ligne: number;
  qte_retour: number; // quantité à retourner
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

function NewReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docType = (searchParams.get('type') || 'bl') as 'bl' | 'invoice';
  const docId = searchParams.get('id') || '';

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

  useEffect(() => {
    if (docId) fetchDocument();
  }, [docId, docType]);

  const fetchDocument = async () => {
    setFetching(true);
    setError('');
    try {
      const tenant = getTenant();
      const endpoint = docType === 'bl'
        ? `sales/delivery-notes/${docId}`
        : `sales/invoices/${docId}`;
      const res = await fetch(getApiUrl(endpoint), { headers: { 'X-Tenant': tenant } });
      const data = await res.json();
      if (data.success && data.data) {
        const doc = data.data;
        const details = (doc.details || []).map((d: any) => ({
          narticle: d.narticle || d.Narticle,
          designation: d.designation,
          qte: parseFloat(d.qte || d.Qte || 0),
          prix: parseFloat(d.prix || 0),
          tva: parseFloat(d.tva || 19),
          total_ligne: parseFloat(d.total_ligne || 0),
          qte_retour: 0
        }));
        setDocument({ ...doc, details });
        setLines(details);
      } else {
        setError('Document introuvable');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setFetching(false);
    }
  };

  const setReturnQty = (index: number, qty: number) => {
    const updated = [...lines];
    const max = updated[index].qte;
    updated[index].qte_retour = Math.min(Math.max(0, qty), max);
    setLines(updated);
  };

  const selectAll = () => {
    setLines(lines.map(l => ({ ...l, qte_retour: l.qte })));
  };

  const clearAll = () => {
    setLines(lines.map(l => ({ ...l, qte_retour: 0 })));
  };

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
      const res = await fetch('/api/sales/credit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant': tenant },
        body: JSON.stringify({
          nclient: document.nclient,
          document_type: docType,
          document_ref: parseInt(docId),
          date_avoir: dateAvoir,
          motif,
          lines: returnLines.map(l => ({
            narticle: l.narticle,
            qte: l.qte_retour,
            prix: l.prix,
            tva: l.tva
          }))
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`✅ ${data.message} — Stock remis à jour`);
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

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' DA';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
        background: 'linear-gradient(135deg, #e74c3c, #c0392b)', borderRadius: 12, padding: '20px 24px', color: 'white' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>↩️ Nouveau Retour / Avoir</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>
            Retour sur {docType === 'bl' ? 'Bon de Livraison' : 'Facture'} {docId ? `N° ${docId}` : ''}
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
        <div style={{ padding: 16, background: '#d4edda', border: '1px solid #28a745', borderRadius: 8, marginBottom: 20, color: '#155724', fontWeight: 600, fontSize: 16 }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ padding: 16, background: '#f8d7da', border: '1px solid #dc3545', borderRadius: 8, marginBottom: 20, color: '#721c24', fontWeight: 600 }}>
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Sélection document */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#333' }}>📋 Document d'origine</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#555' }}>Type de document</label>
              <select value={docType} disabled
                style={{ width: '100%', padding: '10px 12px', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: 14, background: '#f8f9fa' }}>
                <option value="bl">Bon de Livraison</option>
                <option value="invoice">Facture</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#555' }}>N° Document</label>
              <input type="number" value={docId} readOnly
                style={{ width: '100%', padding: '10px 12px', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: 14, background: '#f8f9fa', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#555' }}>Date de l'avoir</label>
              <input type="date" value={dateAvoir} onChange={e => setDateAvoir(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          </div>

          {document && (
            <div style={{ marginTop: 16, padding: 12, background: '#f0f7ff', borderRadius: 8, border: '1px solid #b3d4f5', fontSize: 14 }}>
              <strong>Client:</strong> {document.client_name || document.nclient} &nbsp;|&nbsp;
              <strong>Date:</strong> {new Date(document.date_fact).toLocaleDateString('fr-FR')} &nbsp;|&nbsp;
              <strong>Total TTC:</strong> {fmt(document.montant_ttc || document.montant_ht + document.tva)}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#555' }}>Motif du retour</label>
            <input type="text" value={motif} onChange={e => setMotif(e.target.value)}
              placeholder="Ex: Produit défectueux, erreur de commande..."
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Section 2: Articles à retourner */}
        {fetching && (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>⏳ Chargement du document...</div>
        )}

        {lines.length > 0 && (
          <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>📦 Articles à retourner</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={selectAll}
                  style={{ padding: '6px 14px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Tout retourner
                </button>
                <button type="button" onClick={clearAll}
                  style={{ padding: '6px 14px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Tout effacer
                </button>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>Article</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>Désignation</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 700 }}>Qté livrée</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, fontWeight: 700 }}>Prix</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#e74c3c' }}>Qté retour</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, fontWeight: 700 }}>Montant avoir</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => {
                  const avoirHT = line.qte_retour * line.prix;
                  const avoirTTC = avoirHT * (1 + line.tva / 100);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: line.qte_retour > 0 ? '#fff5f5' : 'white' }}>
                      <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#e74c3c' }}>{line.narticle}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13 }}>{line.designation}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13 }}>{line.qte}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13 }}>{fmt(line.prix)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <input type="number" min={0} max={line.qte} value={line.qte_retour}
                          onChange={e => setReturnQty(i, parseInt(e.target.value) || 0)}
                          style={{ width: 70, padding: '6px 8px', border: `2px solid ${line.qte_retour > 0 ? '#e74c3c' : '#dee2e6'}`,
                            borderRadius: 6, textAlign: 'center', fontSize: 14, fontWeight: 700 }} />
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: line.qte_retour > 0 ? '#e74c3c' : '#999' }}>
                        {line.qte_retour > 0 ? fmt(avoirTTC) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totaux avoir */}
            {returnLines.length > 0 && (
              <div style={{ marginTop: 16, padding: 16, background: '#fff5f5', borderRadius: 8, border: '2px solid #e74c3c' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Montant HT avoir</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#e74c3c' }}>{fmt(totals.ht)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>TVA avoir</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#e74c3c' }}>{fmt(totals.tva)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total TTC avoir</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#e74c3c' }}>{fmt(totals.ttc)}</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: '#666' }}>
                  {returnLines.length} article{returnLines.length > 1 ? 's' : ''} à retourner •
                  Stock {docType === 'bl' ? 'BL (stock_bl)' : 'Facture (stock_f)'} sera remis à jour
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => router.back()}
            style={{ padding: '12px 24px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
            Annuler
          </button>
          <button type="submit" disabled={loading || returnLines.length === 0}
            style={{ padding: '12px 28px', background: returnLines.length === 0 ? '#ccc' : '#e74c3c',
              color: 'white', border: 'none', borderRadius: 8, cursor: returnLines.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: 15, fontWeight: 700 }}>
            {loading ? '⏳ Création...' : `↩️ Créer l'Avoir (${fmt(totals.ttc)})`}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewReturn() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>⏳ Chargement...</div>}>
      <NewReturnContent />
    </Suspense>
  );
}
