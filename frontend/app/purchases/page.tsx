'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import styles from './purchases.module.css';

interface Supplier {
  nfournisseur: string;
  nom_fournisseur: string;
  adresse_fourni?: string;
  tel?: string;
  caf?: number;
  cabl?: number;
}

interface Article {
  narticle: string;
  designation: string;
  prix_unitaire?: number;
  prix_achat?: number;
  prix_vente?: number;
  stock_f?: number;
  stock_bl?: number;
  nfournisseur?: string;
  tva?: number;
}

interface PurchaseLine {
  Narticle: string;
  designation: string;
  Qte: number;
  prix: number;
  tva: number;
  total: number;
}

export default function CreatePurchaseInvoice() {
  const router = useRouter();

  // Données
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  // Formulaire entête
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedSupplierInfo, setSelectedSupplierInfo] = useState<Supplier | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  // Ligne courante
  const [currentLine, setCurrentLine] = useState<{
    Narticle: string; Qte: number; prix: number; tva: number;
  }>({ Narticle: '', Qte: 1, prix: 0, tva: 19 });
  const [selectedArticleInfo, setSelectedArticleInfo] = useState<Article | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Lignes du document
  const [lines, setLines] = useState<PurchaseLine[]>([]);

  // Vérification doublon
  const [duplicateWarning, setDuplicateWarning] = useState('');

  // Paiement
  const [paymentType, setPaymentType] = useState<'total' | 'partial' | 'none'>('total');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Articles filtrés par fournisseur
  const filteredArticles = selectedSupplier
    ? articles.filter(a => !a.nfournisseur || a.nfournisseur.trim() === selectedSupplier.trim())
    : [];

  useEffect(() => {
    fetchSuppliers();
    fetchArticles();
  }, []);

  // Mettre à jour infos fournisseur
  useEffect(() => {
    if (selectedSupplier) {
      const supplier = suppliers.find(s => s.nfournisseur === selectedSupplier);
      setSelectedSupplierInfo(supplier || null);
      // Réinitialiser les lignes quand le fournisseur change
      setLines([]);
      setCurrentLine({ Narticle: '', Qte: 1, prix: 0, tva: 19 });
      setEditingIndex(null);
    } else {
      setSelectedSupplierInfo(null);
    }
  }, [selectedSupplier, suppliers]);

  // Mettre à jour infos article
  useEffect(() => {
    if (currentLine.Narticle) {
      const article = articles.find(a => a.narticle === currentLine.Narticle);
      setSelectedArticleInfo(article || null);
      if (article && editingIndex === null) {
        const prix = article.prix_unitaire || article.prix_achat || 0;
        setCurrentLine(prev => ({
          ...prev,
          prix,
          tva: article.tva || 19
        }));
      }
    } else {
      setSelectedArticleInfo(null);
    }
  }, [currentLine.Narticle, articles]);

  const getTenant = () => {
    const tenantInfo = localStorage.getItem('tenant_info');
    if (tenantInfo) {
      try { return JSON.parse(tenantInfo).schema || '2009_bu02'; } catch {}
    }
    return localStorage.getItem('selectedTenant') || '2009_bu02';
  };

  const fetchSuppliers = async () => {
    try {
      const tenant = getTenant();
      const res = await fetch(getApiUrl('sales/suppliers'), {
        headers: { 'X-Tenant': tenant }
      });
      const data = await res.json();
      if (data.success) setSuppliers(data.data);
    } catch (e) {
      console.error('Error fetching suppliers:', e);
    }
  };

  const fetchArticles = async () => {
    try {
      const tenant = getTenant();
      const res = await fetch(getApiUrl('sales/articles'), {
        headers: { 'X-Tenant': tenant }
      });
      const data = await res.json();
      if (data.success) setArticles(data.data);
    } catch (e) {
      console.error('Error fetching articles:', e);
    }
  };

  const checkDuplicate = async (supplier: string, number: string) => {
    if (!supplier || !number.trim()) { setDuplicateWarning(''); return; }
    try {
      const tenant = getTenant();
      // Chercher dans la liste existante
      const res = await fetch(getApiUrl('purchases/invoices'), {
        headers: { 'X-Tenant': tenant }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const dup = data.data.find((inv: any) =>
          inv.nfournisseur === supplier &&
          inv.numero_facture_fournisseur === number.trim()
        );
        if (dup) {
          setDuplicateWarning(
            `⚠️ DOUBLON DÉTECTÉ — La facture "${dup.numero_facture_fournisseur}" du fournisseur "${dup.supplier_name || dup.nfournisseur}" existe déjà (N° interne: ${dup.nfact_achat}, Date: ${new Date(dup.date_fact).toLocaleDateString('fr-FR')}, Total: ${dup.total_ttc?.toFixed(2)} DA)`
          );
        } else {
          setDuplicateWarning('');
        }
      }
    } catch (e) { setDuplicateWarning(''); }
  };

  const handleArticleChange = (narticle: string) => {
    const article = articles.find(a => a.narticle === narticle);
    if (article && editingIndex === null) {
      setCurrentLine({
        Narticle: narticle,
        Qte: 1,
        prix: article.prix_unitaire || article.prix_achat || 0,
        tva: article.tva || 19
      });
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

    const total = currentLine.Qte * currentLine.prix;
    const newLine: PurchaseLine = {
      Narticle: currentLine.Narticle,
      designation: article.designation,
      Qte: currentLine.Qte,
      prix: currentLine.prix,
      tva: currentLine.tva,
      total
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
    if (!invoiceNumber.trim()) { setError('Veuillez saisir le numéro de facture fournisseur'); return; }
    if (lines.length === 0) { setError('Veuillez ajouter au moins un article'); return; }
    if (duplicateWarning) { setError('Enregistrement bloqué: doublon détecté. Vérifiez le numéro de facture.'); return; }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const tenant = getTenant();
      const res = await fetch(getApiUrl('purchases/invoices'), {
        method: 'POST',
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
        const factId = data.data.nfact_achat;

        // Enregistrer le paiement si nécessaire
        if (paymentType !== 'none') {
          const amountToPay = paymentType === 'total' ? totals.totalTTC : paymentAmount;
          if (amountToPay > 0) {
            try {
              await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Tenant': tenant },
                body: JSON.stringify({
                  documentType: 'purchase_invoice',
                  documentId: factId,
                  paymentDate: invoiceDate,
                  amount: amountToPay,
                  paymentMethod,
                  notes: paymentNotes || null
                })
              });
            } catch (pe) {
              console.error('Payment error:', pe);
            }
          }
        }

        setSuccess(`✅ Facture d'achat N° ${factId} créée avec succès !`);
        // Recharger les articles pour avoir les stocks à jour
        fetchArticles();
        // Reset
        setSelectedSupplier('');
        setInvoiceNumber('');
        setInvoiceDate(new Date().toISOString().split('T')[0]);
        setLines([]);
        setCurrentLine({ Narticle: '', Qte: 1, prix: 0, tva: 19 });
        setPaymentType('total');
        setPaymentAmount(0);
        setPaymentMethod('cash');
        setPaymentNotes('');
      } else {
        setError(data.error || 'Erreur lors de la création');
      }
    } catch (e) {
      console.error('Error:', e);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* En-tête */}
      <header className={styles.header}>
        <div className={styles.title}>
          🛒 Nouvelle Facture d'Achat
        </div>
        <div className={styles.headerButtons}>
          <button onClick={() => router.push('/purchase-delivery-notes')} className={styles.navButton}>
            📦 BL d'Achat
          </button>
          <button onClick={() => router.push('/purchases/invoices/list')} className={styles.navButton}>
            📋 Liste Factures
          </button>
          <button onClick={() => router.push('/suppliers/debts')} className={styles.navButton}>
            💸 Dettes Fournisseurs
          </button>
          <button onClick={() => router.push('/dashboard')} className={styles.backButton}>
            ← Retour
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
                onChange={(e) => {
                  setSelectedSupplier(e.target.value);
                  checkDuplicate(e.target.value, invoiceNumber);
                }}
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
                onChange={(e) => {
                  setInvoiceNumber(e.target.value);
                  checkDuplicate(selectedSupplier, e.target.value);
                }}
                required
                style={duplicateWarning ? { borderColor: '#dc3545', boxShadow: '0 0 0 3px rgba(220,53,69,0.15)' } : {}}
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

          {/* Carte fournisseur */}
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
                <div className={styles.supplierInfoItem}>
                  <span className={styles.supplierInfoLabel}>Articles disponibles</span>
                  <span className={styles.supplierInfoValue}>{filteredArticles.length}</span>
                </div>
              </div>
            </div>
          )}
          {/* Alerte doublon */}
          {duplicateWarning && (
            <div style={{
              marginTop: '15px',
              padding: '16px 20px',
              background: '#f8d7da',
              border: '2px solid #dc3545',
              borderRadius: '10px',
              color: '#721c24',
              fontWeight: '600',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              🚫 {duplicateWarning}
              <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: '400' }}>
                Modifiez le numéro de facture ou sélectionnez un autre fournisseur pour continuer.
              </div>
            </div>
          )}
        </div>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {editingIndex !== null ? '✏️ Modifier l\'Article' : '➕ Ajouter un Article'}
          </h2>

          {selectedSupplier && (
            <div className={styles.articlesInfo}>
              📦 <strong>{filteredArticles.length}</strong> article{filteredArticles.length > 1 ? 's' : ''} disponible{filteredArticles.length > 1 ? 's' : ''} pour <strong>{selectedSupplierInfo?.nom_fournisseur}</strong>
            </div>
          )}

          {/* Carte article sélectionné */}
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
                disabled={!selectedSupplier}
              >
                <option value="">
                  {!selectedSupplier
                    ? '— Sélectionner d\'abord un fournisseur —'
                    : filteredArticles.length === 0
                    ? '— Aucun article pour ce fournisseur —'
                    : '— Sélectionner un article —'}
                </option>
                {filteredArticles.map(a => (
                  <option key={a.narticle} value={a.narticle}>
                    {a.narticle} — {a.designation}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Quantité *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                lang="en"
                value={currentLine.Qte || ''}
                onChange={(e) => setCurrentLine({ ...currentLine, Qte: parseFloat(e.target.value) || 0 })}
                onFocus={(e) => e.target.select()}
                placeholder="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Prix Unitaire (DA) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                lang="en"
                value={currentLine.prix || ''}
                onChange={(e) => setCurrentLine({ ...currentLine, prix: parseFloat(e.target.value) || 0 })}
                onFocus={(e) => e.target.select()}
                placeholder="0.00"
              />
            </div>

            <div className={styles.formGroup}>
              <label>TVA (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                lang="en"
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
                  onClick={() => {
                    setEditingIndex(null);
                    setCurrentLine({ Narticle: '', Qte: 1, prix: 0, tva: 19 });
                  }}
                  className={styles.cancelButton}
                  style={{ padding: '12px 16px' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ===== SECTION 3: LIGNES DU DOCUMENT ===== */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📦 Articles de la Facture</h2>

          {lines.length === 0 ? (
            <div className={styles.emptyState}>
              Aucun article ajouté. Sélectionnez un fournisseur et un article ci-dessus pour commencer.
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

              {/* Totaux */}
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

          <div className={styles.paymentGrid}>
            <div className={styles.formGroup}>
              <label>Type de paiement</label>
              <select
                value={paymentType}
                onChange={(e) => {
                  const t = e.target.value as 'total' | 'partial' | 'none';
                  setPaymentType(t);
                  if (t === 'total') setPaymentAmount(totals.totalTTC);
                  else if (t === 'none') setPaymentAmount(0);
                }}
              >
                <option value="total">✅ Paiement total</option>
                <option value="partial">⚠️ Paiement partiel (à crédit)</option>
                <option value="none">❌ Aucun paiement (dette totale)</option>
              </select>
            </div>

            {paymentType === 'partial' && (
              <div className={styles.formGroup}>
                <label>Montant versé (DA)</label>
                <input
                  type="number"
                  step="0.01"
                  lang="en"
                  min="0.01"
                  max={totals.totalTTC}
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  placeholder="0.00"
                />
                <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Total TTC: {totals.totalTTC.toFixed(2)} DA
                </small>
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

            {paymentType === 'partial' && (
              <div className={styles.formGroup}>
                <label>Notes (optionnel)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ex: Premier versement..."
                />
              </div>
            )}
          </div>

          {/* Alerte dette */}
          {paymentType === 'none' && lines.length > 0 && (
            <div className={styles.debtAlert}>
              ⚠️ Dette totale envers le fournisseur: <strong>{totals.totalTTC.toFixed(2)} DA</strong>
            </div>
          )}
          {paymentType === 'partial' && paymentAmount > 0 && paymentAmount < totals.totalTTC && (
            <div className={styles.debtAlert}>
              ⚠️ Reste à payer au fournisseur: <strong>{(totals.totalTTC - paymentAmount).toFixed(2)} DA</strong>
            </div>
          )}
          {paymentType === 'total' && lines.length > 0 && (
            <div style={{
              padding: '14px 18px',
              background: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
              marginTop: '15px',
              fontWeight: '600',
              color: '#155724'
            }}>
              ✅ Paiement total: <strong>{totals.totalTTC.toFixed(2)} DA</strong> — Aucune dette
            </div>
          )}
        </div>

        {/* Messages */}
        {error && <div className={styles.errorMsg}>❌ {error}</div>}
        {success && <div className={styles.successMsg}>{success}</div>}

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className={styles.cancelButton}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || lines.length === 0 || !!duplicateWarning}
            className={styles.submitButton}
          >
            {loading ? '⏳ Création en cours...' : '🛒 Créer la Facture d\'Achat'}
          </button>
        </div>

      </form>
    </div>
  );
}
