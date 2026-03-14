'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import styles from '../../../purchases.module.css';

interface Supplier {
  nfournisseur: string;
  nom_fournisseur: string;
  adresse_fourni?: string;
  tel?: string;
}

interface Article {
  narticle: string;
  designation: string;
  prix_unitaire?: number;
  prix_achat?: number;
  tva?: number;
  stock_f?: number;
  nfournisseur?: string;
}

interface PurchaseLine {
  Narticle: string;
  designation: string;
  Qte: number;
  prix: number;
  tva: number;
  total: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditPurchaseInvoice({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const invoiceId = resolvedParams.id;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  // Entête
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedSupplierInfo, setSelectedSupplierInfo] = useState<Supplier | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');

  // Ligne courante
  const [currentLine, setCurrentLine] = useState({ Narticle: '', Qte: 1, prix: 0, tva: 19 });
  const [selectedArticleInfo, setSelectedArticleInfo] = useState<Article | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Lignes
  const [lines, setLines] = useState<PurchaseLine[]>([]);

  // Paiement
  const [paymentType, setPaymentType] = useState<'total' | 'partial' | 'none'>('none');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [existingPayments, setExistingPayments] = useState<{id: number; paymentDate: string; amount: number; paymentMethod: string; notes?: string}[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);

  // UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Articles filtrés par fournisseur (en édition on garde tous les articles du fournisseur)
  const filteredArticles = selectedSupplier
    ? articles.filter(a => !a.nfournisseur || a.nfournisseur.trim() === selectedSupplier.trim())
    : [];

  const getTenant = () => {
    const tenantInfo = localStorage.getItem('tenant_info');
    if (tenantInfo) {
      try { return JSON.parse(tenantInfo).schema || '2009_bu02'; } catch {}
    }
    return localStorage.getItem('selectedTenant') || '2009_bu02';
  };

  useEffect(() => {
    fetchInvoice();
    fetchSuppliers();
    fetchArticles();
  }, [invoiceId]);

  useEffect(() => {
    if (invoiceId) fetchExistingPayments();
  }, [invoiceId]);

  useEffect(() => {
    if (selectedSupplier && suppliers.length > 0) {
      const s = suppliers.find(s => s.nfournisseur === selectedSupplier);
      setSelectedSupplierInfo(s || null);
    }
  }, [selectedSupplier, suppliers]);

  useEffect(() => {
    if (currentLine.Narticle) {
      const a = articles.find(a => a.narticle === currentLine.Narticle);
      setSelectedArticleInfo(a || null);
      if (a && editingIndex === null) {
        setCurrentLine(prev => ({
          ...prev,
          prix: a.prix_unitaire || a.prix_achat || 0,
          tva: a.tva || 19
        }));
      }
    } else {
      setSelectedArticleInfo(null);
    }
  }, [currentLine.Narticle, articles]);

  const fetchInvoice = async () => {
    try {
      const tenant = getTenant();
      const res = await fetch(getApiUrl(`purchases/invoices/${invoiceId}`), {
        headers: { 'X-Tenant': tenant }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const inv = data.data;
        setSelectedSupplier(inv.nfournisseur);
        setInvoiceNumber(inv.numero_facture_fournisseur || '');
        setInvoiceDate(inv.date_fact?.split('T')[0] || '');
        const loadedLines: PurchaseLine[] = (inv.details || []).map((d: any) => ({
          Narticle: d.narticle,
          designation: d.designation || d.narticle,
          Qte: d.qte,
          prix: d.prix,
          tva: d.tva,
          total: d.qte * d.prix
        }));
        setLines(loadedLines);
      } else {
        setError('Facture introuvable');
      }
    } catch (e) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const tenant = getTenant();
      const res = await fetch(getApiUrl('sales/suppliers'), { headers: { 'X-Tenant': tenant } });
      const data = await res.json();
      if (data.success) setSuppliers(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchArticles = async () => {
    try {
      const tenant = getTenant();
      const res = await fetch(getApiUrl('sales/articles'), { headers: { 'X-Tenant': tenant } });
      const data = await res.json();
      if (data.success) setArticles(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchExistingPayments = async () => {
    try {
      const tenant = getTenant();
      const res = await fetch(getApiUrl(`purchases/payments/purchase_invoice/${invoiceId}`), {
        headers: { 'X-Tenant': tenant }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const payments = data.data.payments || [];
        setExistingPayments(payments.map((p: any) => ({
          id: p.id,
          paymentDate: p.payment_date,
          amount: parseFloat(p.amount),
          paymentMethod: p.payment_method,
          notes: p.notes
        })));
        setTotalPaid(data.data.total_paid || 0);
      }
    } catch (e) { console.error('Error fetching payments:', e); }
  };

  const handleArticleChange = (narticle: string) => {
    const a = articles.find(a => a.narticle === narticle);
    if (a && editingIndex === null) {
      setCurrentLine({ Narticle: narticle, Qte: 1, prix: a.prix_unitaire || a.prix_achat || 0, tva: a.tva || 19 });
    } else {
      setCurrentLine(prev => ({ ...prev, Narticle: narticle }));
    }
  };

  const addLine = () => {
    if (!currentLine.Narticle || currentLine.Qte <= 0) {
      alert('Veuillez sélectionner un article et une quantité valide');
      return;
    }
    const article = articles.find(a => a.narticle === currentLine.Narticle);
    if (!article) { alert('Article non trouvé'); return; }

    const newLine: PurchaseLine = {
      Narticle: currentLine.Narticle,
      designation: article.designation,
      Qte: currentLine.Qte,
      prix: currentLine.prix,
      tva: currentLine.tva,
      total: currentLine.Qte * currentLine.prix
    };

    if (editingIndex !== null) {
      const updated = [...lines];
      updated[editingIndex] = newLine;
      setLines(updated);
      setEditingIndex(null);
    } else {
      setLines([...lines, newLine]);
    }
    setCurrentLine({ Narticle: '', Qte: 1, prix: 0, tva: 19 });
  };

  const editLine = (index: number) => {
    const line = lines[index];
    setCurrentLine({ Narticle: line.Narticle, Qte: line.Qte, prix: line.prix, tva: line.tva });
    setEditingIndex(index);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setCurrentLine({ Narticle: '', Qte: 1, prix: 0, tva: 19 });
    }
  };

  const calculateTotals = () => {
    const montantHT = lines.reduce((s, l) => s + l.total, 0);
    const totalTVA = lines.reduce((s, l) => s + (l.total * l.tva / 100), 0);
    return { montantHT, totalTVA, totalTTC: montantHT + totalTVA };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) { setError('Veuillez sélectionner un fournisseur'); return; }
    if (!invoiceNumber.trim()) { setError('Veuillez saisir le numéro de facture'); return; }
    if (lines.length === 0) { setError('Veuillez ajouter au moins un article'); return; }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const tenant = getTenant();
      const res = await fetch(getApiUrl(`purchases/invoices/${invoiceId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Tenant': tenant },
        body: JSON.stringify({
          Nfournisseur: selectedSupplier,
          numero_facture_fournisseur: invoiceNumber,
          date_fact: invoiceDate,
          detail_fact_achat: lines.map(l => ({
            Narticle: l.Narticle,
            Qte: l.Qte,
            prix: l.prix,
            tva: l.tva
          }))
        })
      });

      const data = await res.json();
      if (data.success) {
        // Enregistrer un nouveau paiement si demandé
        if (paymentType !== 'none') {
          const amountToPay = paymentType === 'total' ? Math.max(0, totals.totalTTC - totalPaid) : paymentAmount;
          if (amountToPay > 0) {
            try {
              const today = new Date().toISOString().split('T')[0];
              await fetch(getApiUrl('purchases/payments'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Tenant': getTenant() },
                body: JSON.stringify({
                  document_type: 'purchase_invoice',
                  document_id: parseInt(invoiceId),
                  payment_date: invoiceDate || today,
                  amount: amountToPay,
                  payment_method: paymentMethod,
                  notes: paymentNotes || null
                })
              });
            } catch (pe) { console.error('Payment error:', pe); }
          }
        }
        setSuccess('✅ Facture modifiée avec succès !');
        setTimeout(() => router.push('/purchases/invoices/list'), 1500);
      } else {
        setError(data.error || 'Erreur lors de la modification');
      }
    } catch (e) {
      setError('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-tertiary)', fontSize: '18px' }}>
          ⏳ Chargement de la facture...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* En-tête */}
      <header className={styles.header}>
        <div className={styles.title}>
          ✏️ Modifier Facture d'Achat
          {invoiceNumber && (
            <span className={styles.docNumber}>{invoiceNumber}</span>
          )}
        </div>
        <div className={styles.headerButtons}>
          <button onClick={() => router.push('/purchases/invoices/list')} className={styles.navButton}>
            📋 Liste Factures
          </button>
          <button onClick={() => router.push('/purchases/invoices/list')} className={styles.backButton}>
            ← Annuler
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>

        {/* ===== SECTION 1: INFORMATIONS GÉNÉRALES ===== */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📋 Informations Générales</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Fournisseur *</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                required
              >
                <option value="">— Sélectionner un fournisseur —</option>
                {suppliers.map((s, i) => (
                  <option key={`${s.nfournisseur}-${i}`} value={s.nfournisseur}>
                    {s.nom_fournisseur} ({s.nfournisseur})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>N° Facture Fournisseur *</label>
              <input
                type="text"
                placeholder="Ex: FAC-2025-001"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Date de Facture</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
          </div>

          {selectedSupplierInfo && (
            <div className={styles.supplierInfoCard}>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
                🏭 {selectedSupplierInfo.nom_fournisseur}
              </div>
              <div className={styles.supplierInfoGrid}>
                <div className={styles.supplierInfoItem}>
                  <span className={styles.supplierInfoLabel}>Code Fournisseur</span>
                  <span className={styles.supplierInfoValue}>{selectedSupplierInfo.nfournisseur}</span>
                </div>
                {selectedSupplierInfo.tel && (
                  <div className={styles.supplierInfoItem}>
                    <span className={styles.supplierInfoLabel}>Téléphone</span>
                    <span className={styles.supplierInfoValue}>{selectedSupplierInfo.tel}</span>
                  </div>
                )}
                {selectedSupplierInfo.adresse_fourni && (
                  <div className={styles.supplierInfoItem}>
                    <span className={styles.supplierInfoLabel}>Adresse</span>
                    <span className={styles.supplierInfoValue} style={{ fontSize: '14px' }}>
                      {selectedSupplierInfo.adresse_fourni}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ===== SECTION 2: AJOUTER / MODIFIER ARTICLE ===== */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {editingIndex !== null ? '✏️ Modifier l\'Article' : '➕ Ajouter un Article'}
          </h2>

          {selectedArticleInfo && (
            <div className={styles.articleInfoCard}>
              <div className={styles.articleInfoGrid}>
                <div className={styles.articleInfoItem}>
                  <span className={styles.articleInfoLabel}>Désignation</span>
                  <span className={styles.articleInfoValue} style={{ fontSize: '16px' }}>
                    {selectedArticleInfo.designation}
                  </span>
                </div>
                <div className={styles.articleInfoItem}>
                  <span className={styles.articleInfoLabel}>Stock Disponible</span>
                  <span className={styles.articleInfoValue}>{selectedArticleInfo.stock_f ?? '-'}</span>
                  <span className={`${styles.stockBadge} ${
                    (selectedArticleInfo.stock_f ?? 0) > 100 ? styles.high :
                    (selectedArticleInfo.stock_f ?? 0) > 20 ? styles.medium : styles.low
                  }`}>
                    {(selectedArticleInfo.stock_f ?? 0) > 100 ? '✓ Stock élevé' :
                     (selectedArticleInfo.stock_f ?? 0) > 20 ? '⚠ Stock moyen' : '⚠️ Stock faible'}
                  </span>
                </div>
                <div className={styles.articleInfoItem}>
                  <span className={styles.articleInfoLabel}>Prix d'Achat</span>
                  <span className={styles.articleInfoValue}>
                    {(selectedArticleInfo.prix_unitaire || selectedArticleInfo.prix_achat || 0).toFixed(2)} DA
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Article *</label>
              <select
                value={currentLine.Narticle}
                onChange={(e) => handleArticleChange(e.target.value)}
              >
                <option value="">— Sélectionner un article —</option>
                {(filteredArticles.length > 0 ? filteredArticles : articles).map(a => (
                  <option key={a.narticle} value={a.narticle}>
                    {a.narticle} — {a.designation}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Quantité *</label>
              <input
                type="number" min="0.01" step="0.01" lang="en"
                value={currentLine.Qte || ''}
                onChange={(e) => setCurrentLine({ ...currentLine, Qte: parseFloat(e.target.value) || 0 })}
                onFocus={(e) => e.target.select()}
                placeholder="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Prix Unitaire (DA) *</label>
              <input
                type="number" min="0" step="0.01" lang="en"
                value={currentLine.prix || ''}
                onChange={(e) => setCurrentLine({ ...currentLine, prix: parseFloat(e.target.value) || 0 })}
                onFocus={(e) => e.target.select()}
                placeholder="0.00"
              />
            </div>

            <div className={styles.formGroup}>
              <label>TVA (%)</label>
              <input
                type="number" min="0" max="100" step="0.01" lang="en"
                value={currentLine.tva || ''}
                onChange={(e) => setCurrentLine({ ...currentLine, tva: parseFloat(e.target.value) || 0 })}
                onFocus={(e) => e.target.select()}
                placeholder="19"
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', paddingBottom: '20px' }}>
              <button type="button" onClick={addLine} className={styles.addButton}>
                {editingIndex !== null ? '✓ Modifier' : '+ Ajouter'}
              </button>
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={() => { setEditingIndex(null); setCurrentLine({ Narticle: '', Qte: 1, prix: 0, tva: 19 }); }}
                  className={styles.cancelButton}
                  style={{ padding: '12px 16px' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ===== SECTION 3: TABLEAU DES ARTICLES ===== */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📦 Articles de la Facture</h2>

          {lines.length === 0 ? (
            <div className={styles.emptyState}>
              Aucun article. Utilisez le formulaire ci-dessus pour en ajouter.
            </div>
          ) : (
            <>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Code Article</th>
                    <th>Désignation</th>
                    <th style={{ textAlign: 'right' }}>Quantité</th>
                    <th style={{ textAlign: 'right' }}>Prix Unit. (DA)</th>
                    <th style={{ textAlign: 'right' }}>TVA (%)</th>
                    <th style={{ textAlign: 'right' }}>Total HT (DA)</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index} style={{
                      background: editingIndex === index ? 'rgba(253,126,20,0.08)' : undefined
                    }}>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>{index + 1}</td>
                      <td style={{ fontWeight: '600', color: '#fd7e14' }}>{line.Narticle}</td>
                      <td>{line.designation}</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>{line.Qte}</td>
                      <td style={{ textAlign: 'right' }}>{line.prix.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{line.tva.toFixed(0)}%</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#fd7e14' }}>
                        {line.total.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button type="button" onClick={() => editLine(index)} className={styles.editButton}>
                            ✏️ Modifier
                          </button>
                          <button type="button" onClick={() => removeLine(index)} className={styles.deleteButton}>
                            🗑 Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.totals}>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Montant HT:</span>
                  <span className={styles.totalValue}>{totals.montantHT.toFixed(2)} DA</span>
                </div>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>TVA:</span>
                  <span className={styles.totalValue}>{totals.totalTVA.toFixed(2)} DA</span>
                </div>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Total TTC:</span>
                  <span className={styles.totalValue}>{totals.totalTTC.toFixed(2)} DA</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ===== SECTION 4: PAIEMENT ===== */}
        <div className={styles.paymentSection}>
          <h2 className={styles.sectionTitle}>💰 Paiement Fournisseur</h2>

          {/* Historique des paiements existants */}
          {existingPayments.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', marginBottom: '10px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                📋 Paiements déjà enregistrés:
              </div>
              <table className={styles.table} style={{ marginTop: 0 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Méthode</th>
                    <th style={{ textAlign: 'right' }}>Montant</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {existingPayments.map((p) => (
                    <tr key={p.id}>
                      <td>{new Date(p.paymentDate).toLocaleDateString('fr-FR')}</td>
                      <td>{{cash:'💵 Espèces', check:'📝 Chèque', bank_transfer:'🏦 Virement', credit_card:'💳 Carte'}[p.paymentMethod] || p.paymentMethod}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#fd7e14' }}>{p.amount.toFixed(2)} DA</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{p.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: totalPaid >= totals.totalTTC ? '#d4edda' : '#fff3cd', borderRadius: '8px', marginTop: '10px', fontWeight: '600' }}>
                <span>Total déjà payé:</span>
                <span style={{ color: totalPaid >= totals.totalTTC ? '#155724' : '#856404' }}>
                  {totalPaid.toFixed(2)} DA
                  {totals.totalTTC > 0 && ` / ${totals.totalTTC.toFixed(2)} DA`}
                </span>
              </div>
              {totalPaid < totals.totalTTC && totals.totalTTC > 0 && (
                <div style={{ padding: '10px 16px', background: '#f8d7da', borderRadius: '8px', marginTop: '8px', fontWeight: '600', color: '#721c24' }}>
                  ⚠️ Reste à payer: <strong>{(totals.totalTTC - totalPaid).toFixed(2)} DA</strong>
                </div>
              )}
            </div>
          )}

          {/* Ajouter un nouveau paiement */}
          <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            ➕ Ajouter un paiement supplémentaire:
          </div>
          <div className={styles.paymentGrid}>
            <div className={styles.formGroup}>
              <label>Type de paiement</label>
              <select
                value={paymentType}
                onChange={(e) => {
                  const t = e.target.value as 'total' | 'partial' | 'none';
                  setPaymentType(t);
                  if (t === 'total') setPaymentAmount(Math.max(0, totals.totalTTC - totalPaid));
                  else if (t === 'none') setPaymentAmount(0);
                }}
              >
                <option value="none">— Aucun nouveau paiement —</option>
                <option value="total">✅ Solder le reste ({Math.max(0, totals.totalTTC - totalPaid).toFixed(2)} DA)</option>
                <option value="partial">⚠️ Paiement partiel</option>
              </select>
            </div>

            {paymentType === 'partial' && (
              <div className={styles.formGroup}>
                <label>Montant versé (DA)</label>
                <input
                  type="number" step="0.01" lang="en" min="0.01"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  placeholder="0.00"
                />
              </div>
            )}

            {paymentType !== 'none' && (
              <div className={styles.formGroup}>
                <label>Méthode de paiement</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">💵 Espèces</option>
                  <option value="check">📝 Chèque</option>
                  <option value="bank_transfer">🏦 Virement bancaire</option>
                  <option value="credit_card">💳 Carte bancaire</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            )}

            {paymentType !== 'none' && (
              <div className={styles.formGroup}>
                <label>Notes (optionnel)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ex: Solde final, 2ème versement..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && <div className={styles.errorMsg}>❌ {error}</div>}
        {success && <div className={styles.successMsg}>{success}</div>}

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => router.push('/purchases/invoices/list')}
            className={styles.cancelButton}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving || lines.length === 0}
            className={styles.submitButton}
          >
            {saving ? '⏳ Enregistrement...' : '💾 Enregistrer les Modifications'}
          </button>
        </div>

      </form>
    </div>
  );
}
