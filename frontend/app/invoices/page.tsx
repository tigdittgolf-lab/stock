'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrintOptions from '../../components/PrintOptions';
import styles from '../delivery-notes/delivery-notes.module.css';

interface Client {
  nclient: string;
  raison_sociale: string;
  adresse?: string;
  telephone?: string;
  solde?: number;
  chiffre_affaire?: number;
  c_affaire_fact?: number;
  c_affaire_bl?: number;
}

interface Article {
  narticle: string;
  designation: string;
  prix_vente: number;
  tva: number;
  stock_f: number;
  stock_bl: number;
}

interface InvoiceLine {
  Narticle: string;
  designation: string;
  Qte: number;
  prix: number;
  tva: number;
  total_ligne: number;
}

export default function CreateInvoice() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedClientInfo, setSelectedClientInfo] = useState<Client | null>(null);
  const [selectedArticleInfo, setSelectedArticleInfo] = useState<Article | null>(null);
  const [dateFacture, setDateFacture] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [currentLine, setCurrentLine] = useState({ Narticle: '', Qte: 1, prix: 0, tva: 0 });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<number | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<{ id: number; number: number; clientName: string } | null>(null);

  const [paymentType, setPaymentType] = useState<'total' | 'partial'>('total');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  useEffect(() => {
    fetchClients();
    fetchArticles();
    fetchNextInvoiceNumber();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      const tenantInfoStr = localStorage.getItem('tenant_info');
      let tenantInfo = null;
      try { if (tenantInfoStr) tenantInfo = JSON.parse(tenantInfoStr); } catch {}
      const tenant = tenantInfo?.schema || localStorage.getItem('selectedTenant') || '2009_bu02';
      const dbType = tenantInfo?.database_type || 'supabase';

      fetch(`/api/sales/clients/${selectedClient}/debt`, {
        headers: { 'x-tenant': tenant, 'x-database-type': dbType }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) setSelectedClientInfo(data.data);
          else setSelectedClientInfo(clients.find(c => c.nclient === selectedClient) || null);
        })
        .catch(() => setSelectedClientInfo(clients.find(c => c.nclient === selectedClient) || null));
    } else {
      setSelectedClientInfo(null);
    }
  }, [selectedClient, clients]);

  useEffect(() => {
    if (currentLine.Narticle) {
      const article = articles.find(a => a.narticle === currentLine.Narticle);
      setSelectedArticleInfo(article || null);
      if (article) {
        setCurrentLine(prev => ({ ...prev, prix: article.prix_vente, tva: article.tva }));
      }
    } else {
      setSelectedArticleInfo(null);
    }
  }, [currentLine.Narticle, articles]);

  const getTenant = () => {
    const tenantInfoStr = localStorage.getItem('tenant_info');
    let tenantInfo = null;
    try { if (tenantInfoStr) tenantInfo = JSON.parse(tenantInfoStr); } catch {}
    const schema = tenantInfo?.schema || localStorage.getItem('selectedTenant') || '2025_bu01';
    const dbConfig = localStorage.getItem('activeDbConfig');
    const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
    return { schema, dbType };
  };

  const fetchNextInvoiceNumber = async () => {
    try {
      const { schema, dbType } = getTenant();
      const res = await fetch(`/api/sales/invoices/next-number`, {
        headers: { 'X-Tenant': schema, 'X-Database-Type': dbType }
      });
      const data = await res.json();
      if (data.success) setNextInvoiceNumber(data.data.next_number);
    } catch {}
  };

  const fetchClients = async () => {
    try {
      const { schema, dbType } = getTenant();
      const res = await fetch(`/api/sales/clients`, {
        headers: { 'X-Tenant': schema, 'X-Database-Type': dbType }
      });
      const data = await res.json();
      if (data.success) setClients(data.data);
    } catch {}
  };

  const fetchArticles = async () => {
    try {
      const { schema, dbType } = getTenant();
      const res = await fetch(`/api/sales/articles`, {
        headers: { 'X-Tenant': schema, 'X-Database-Type': dbType }
      });
      const data = await res.json();
      if (data.success) setArticles(data.data);
    } catch {}
  };

  const handleArticleChange = (articleId: string) => {
    if (editingIndex !== null && currentLine.Narticle === articleId) return;
    setCurrentLine(prev => ({ ...prev, Narticle: articleId }));
  };

  const addLine = () => {
    if (!currentLine.Narticle || currentLine.Qte <= 0) {
      alert('Veuillez sélectionner un article et une quantité valide');
      return;
    }
    const article = articles.find(a => a.narticle === currentLine.Narticle);
    if (!article) return;

    if (currentLine.Qte > article.stock_f) {
      alert(`Stock facture insuffisant! Stock disponible: ${article.stock_f}`);
      return;
    }

    const newLine: InvoiceLine = {
      Narticle: currentLine.Narticle,
      designation: article.designation,
      Qte: currentLine.Qte,
      prix: parseFloat(currentLine.prix.toString()) || 0,
      tva: parseFloat(currentLine.tva.toString()) || 0,
      total_ligne: currentLine.Qte * currentLine.prix
    };

    if (editingIndex !== null) {
      const updated = [...lines];
      updated[editingIndex] = newLine;
      setLines(updated);
    } else {
      setLines([...lines, newLine]);
    }
    resetCurrentLine();
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
    if (editingIndex === index) resetCurrentLine();
  };

  const editLine = (index: number) => {
    const l = lines[index];
    setCurrentLine({ Narticle: l.Narticle, Qte: l.Qte, prix: l.prix, tva: l.tva });
    setEditingIndex(index);
  };

  const resetCurrentLine = () => {
    setCurrentLine({ Narticle: '', Qte: 1, prix: 0, tva: 0 });
    setEditingIndex(null);
  };

  const calculateTotals = () => {
    const montantHT = lines.reduce((s, l) => s + l.total_ligne, 0);
    const totalTVA = lines.reduce((s, l) => s + (l.total_ligne * l.tva / 100), 0);
    return { montantHT, totalTVA, totalTTC: montantHT + totalTVA };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) { alert('Veuillez sélectionner un client'); return; }
    if (lines.length === 0) { alert('Veuillez ajouter au moins une ligne'); return; }

    try {
      const tenantInfoStr = localStorage.getItem('tenant_info');
      if (!tenantInfoStr) { alert('Erreur: Informations de tenant manquantes'); return; }
      const tenant = JSON.parse(tenantInfoStr);
      const tenantSchema = tenant.schema || localStorage.getItem('selectedTenant') || '2009_bu02';
      const dbConfig = localStorage.getItem('activeDbConfig');
      const databaseType = dbConfig ? JSON.parse(dbConfig).type : 'mysql';

      const response = await fetch(`/api/sales/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant': tenantSchema, 'X-Database-Type': databaseType },
        body: JSON.stringify({
          Nclient: selectedClient,
          date_fact: dateFacture,
          detail_fact: lines.map(l => ({ Narticle: l.Narticle, Qte: l.Qte, prix: l.prix, tva: l.tva, pr_achat: 0 }))
        }),
      });

      const data = await response.json();
      if (data.success) {
        const invoiceNumber = data.data.nfact;
        const totalTTC = data.data.total_ttc || totals.totalTTC;

        if (paymentType === 'total' || (paymentType === 'partial' && paymentAmount > 0)) {
          const amountToPay = paymentType === 'total' ? totalTTC : paymentAmount;
          try {
            await fetch(`/api/payments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-Tenant': tenantSchema, 'X-Database-Type': databaseType },
              body: JSON.stringify({
                documentType: 'invoice', documentId: invoiceNumber,
                paymentDate: dateFacture, amount: amountToPay,
                paymentMethod, notes: paymentNotes || null
              })
            });
          } catch {}
        }

        const clientName = clients.find(c => c.nclient === selectedClient)?.raison_sociale || selectedClient;
        setCreatedInvoice({ id: invoiceNumber, number: invoiceNumber, clientName });
        setSelectedClient('');
        setDateFacture(new Date().toISOString().split('T')[0]);
        setLines([]);
        resetCurrentLine();
        setPaymentType('total');
        setPaymentAmount(0);
        setPaymentMethod('cash');
        setPaymentNotes('');
        setShowPrintModal(true);
      } else {
        alert('❌ Erreur: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Erreur lors de la création de la facture');
    }
  };

  const totals = calculateTotals();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>
          Créer une Facture
          {nextInvoiceNumber && <span className={styles.blNumber}>N° {nextInvoiceNumber}</span>}
        </div>
        <button onClick={() => router.push('/invoices/list')} className={styles.backButton}>
          ← Retour
        </button>
      </header>

      <main className={styles.form}>
        <form onSubmit={handleSubmit}>
          {/* Section client */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Informations Facture</h2>
            <div className={styles.formGroup}>
              <label>Client:</label>
              <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} required>
                <option value="">Sélectionner un client</option>
                {clients.map((client, i) => (
                  <option key={`${client.nclient}-${i}`} value={client.nclient}>
                    {client.nclient} - {client.raison_sociale}
                  </option>
                ))}
              </select>
            </div>

            {selectedClientInfo && (
              <div className={`${styles.clientInfoCard} ${selectedClientInfo.solde && selectedClientInfo.solde > 0 ? styles.warning : styles.success}`}>
                <div className={styles.clientInfoGrid}>
                  <div className={styles.clientInfoItem}>
                    <span className={styles.clientInfoLabel}>Raison Sociale</span>
                    <span className={styles.clientInfoValue}>{selectedClientInfo.raison_sociale}</span>
                  </div>
                  <div className={styles.clientInfoItem}>
                    <span className={styles.clientInfoLabel}>Téléphone</span>
                    <span className={styles.clientInfoValue}>{selectedClientInfo.telephone || 'N/A'}</span>
                  </div>
                  <div className={styles.clientInfoItem}>
                    <span className={styles.clientInfoLabel}>CA Factures</span>
                    <span className={styles.clientInfoValue} style={{ color: '#fff', fontWeight: 'bold' }}>
                      {selectedClientInfo.c_affaire_fact ? `${selectedClientInfo.c_affaire_fact.toFixed(2)} DA` : '0.00 DA'}
                    </span>
                  </div>
                  <div className={styles.clientInfoItem}>
                    <span className={styles.clientInfoLabel}>CA Total</span>
                    <span className={styles.clientInfoValue} style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                      {selectedClientInfo.chiffre_affaire ? `${selectedClientInfo.chiffre_affaire.toFixed(2)} DA` : '0.00 DA'}
                    </span>
                  </div>
                  <div className={styles.clientInfoItem}>
                    <span className={styles.clientInfoLabel}>Dette / Reste à Payer</span>
                    <span className={styles.clientInfoValue} style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                      {selectedClientInfo.solde ? `${selectedClientInfo.solde.toFixed(2)} DA` : '0.00 DA'}
                    </span>
                    <span className={styles.clientStatus}>
                      {selectedClientInfo.solde && selectedClientInfo.solde > 0 ? '⚠️ Client endetté' : '✅ Aucune dette'}
                    </span>
                  </div>
                </div>
                {selectedClientInfo.adresse && (
                  <div style={{ marginTop: '12px', opacity: 0.9 }}>
                    <span className={styles.clientInfoLabel}>Adresse:</span> {selectedClientInfo.adresse}
                  </div>
                )}
              </div>
            )}

            <div className={styles.formGroup} style={{ marginTop: '20px' }}>
              <label>Date:</label>
              <input type="date" value={dateFacture} onChange={(e) => setDateFacture(e.target.value)} required />
            </div>
          </div>

          {/* Section articles */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Ajouter des Articles</h2>

            {selectedArticleInfo && (
              <div className={styles.articleInfoCard}>
                <div className={styles.articleInfoGrid}>
                  <div className={styles.articleInfoItem}>
                    <span className={styles.articleInfoLabel}>Désignation</span>
                    <span className={styles.articleInfoValue}>{selectedArticleInfo.designation}</span>
                  </div>
                  <div className={styles.articleInfoItem}>
                    <span className={styles.articleInfoLabel}>Stock Facture Disponible</span>
                    <span className={styles.articleInfoValue}>{selectedArticleInfo.stock_f}</span>
                    <span className={`${styles.stockBadge} ${selectedArticleInfo.stock_f > 100 ? styles.high : selectedArticleInfo.stock_f > 20 ? styles.medium : styles.low}`}>
                      {selectedArticleInfo.stock_f > 100 ? '✓ Stock élevé' : selectedArticleInfo.stock_f > 20 ? '⚠ Stock moyen' : '⚠️ Stock faible'}
                    </span>
                  </div>
                  <div className={styles.articleInfoItem}>
                    <span className={styles.articleInfoLabel}>Stock BL</span>
                    <span className={styles.articleInfoValue}>{selectedArticleInfo.stock_bl}</span>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Article:</label>
                <select value={currentLine.Narticle} onChange={(e) => handleArticleChange(e.target.value)}>
                  <option value="">Sélectionner un article</option>
                  {articles.map(a => (
                    <option key={a.narticle} value={a.narticle}>
                      {a.narticle} - {a.designation}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Quantité:</label>
                <input type="number" min="1" max={selectedArticleInfo?.stock_f || 999999}
                  value={currentLine.Qte}
                  onChange={(e) => setCurrentLine({ ...currentLine, Qte: parseInt(e.target.value) || 1 })}
                  onFocus={(e) => e.target.select()} />
              </div>
              <div className={styles.formGroup}>
                <label>Prix Unitaire:</label>
                <input type="number" step="0.01" lang="en" value={currentLine.prix}
                  onChange={(e) => setCurrentLine({ ...currentLine, prix: parseFloat(e.target.value) || 0 })}
                  onFocus={(e) => e.target.select()} />
              </div>
              <div className={styles.formGroup}>
                <label>TVA (%):</label>
                <input type="number" step="0.01" lang="en" value={currentLine.tva}
                  onChange={(e) => setCurrentLine({ ...currentLine, tva: parseFloat(e.target.value) || 0 })}
                  onFocus={(e) => e.target.select()} />
              </div>
              <button type="button" onClick={addLine} className={styles.addButton}>
                {editingIndex !== null ? '✔ Modifier' : '+ Ajouter'}
              </button>
              {editingIndex !== null && (
                <button type="button" onClick={resetCurrentLine}
                  style={{ padding: '12px 24px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  ✕ Annuler
                </button>
              )}
            </div>
          </div>

          {/* Lignes */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Lignes de Facture</h2>
            {lines.length === 0 ? (
              <div className={styles.emptyState}>Aucune ligne ajoutée. Sélectionnez un article ci-dessus pour commencer.</div>
            ) : (
              <>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Désignation</th>
                      <th>Quantité</th>
                      <th>Prix Unit.</th>
                      <th>TVA (%)</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => (
                      <tr key={index}>
                        <td>{line.Narticle}</td>
                        <td>{line.designation}</td>
                        <td>{line.Qte}</td>
                        <td>{line.prix.toFixed(2)} DA</td>
                        <td>{line.tva.toFixed(0)}%</td>
                        <td>{line.total_ligne.toFixed(2)} DA</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button type="button" onClick={() => editLine(index)} className={styles.editButton}>✏️ Modifier</button>
                            <button type="button" onClick={() => removeLine(index)} className={styles.deleteButton}>🗑 Supprimer</button>
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

          {/* Paiement */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>💰 Paiement</h2>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Type de paiement:</label>
                <select value={paymentType} onChange={(e) => {
                  const type = e.target.value as 'total' | 'partial';
                  setPaymentType(type);
                  if (type === 'total') setPaymentAmount(totals.totalTTC);
                }}>
                  <option value="total">Paiement total</option>
                  <option value="partial">Paiement partiel</option>
                </select>
              </div>
              {paymentType === 'partial' && (
                <div className={styles.formGroup}>
                  <label>Montant versé (DA):</label>
                  <input type="number" step="0.01" lang="en" min="0" max={totals.totalTTC}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()} placeholder="0.00" />
                  <small style={{ color: '#666', fontSize: '12px' }}>Total TTC: {totals.totalTTC.toFixed(2)} DA</small>
                </div>
              )}
              <div className={styles.formGroup}>
                <label>Méthode de paiement:</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">Espèces</option>
                  <option value="check">Chèque</option>
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="credit_card">Carte bancaire</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>
            {paymentType === 'partial' && (
              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Notes (optionnel):</label>
                  <textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Ex: Premier versement, reste à payer..." rows={2}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', fontFamily: 'inherit' }} />
                </div>
              </div>
            )}
            {paymentType === 'partial' && paymentAmount > 0 && paymentAmount < totals.totalTTC && (
              <div style={{ padding: '12px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: '8px', marginTop: '12px', color: 'var(--warning-text)' }}>
                <strong>⚠️ Reste à payer: {(totals.totalTTC - paymentAmount).toFixed(2)} DA</strong>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={() => router.push('/invoices/list')} className={styles.cancelButton}>Annuler</button>
            <button type="submit" className={styles.submitButton} disabled={lines.length === 0 || !selectedClient}>
              ✔ Créer la Facture
            </button>
          </div>
        </form>
      </main>

      {showPrintModal && createdInvoice && (
        <PrintOptions
          documentType="invoice"
          documentId={createdInvoice.id}
          documentNumber={createdInvoice.number}
          clientName={createdInvoice.clientName}
          clientId={selectedClient}
          isModal={true}
          onClose={() => {
            setShowPrintModal(false);
            setCreatedInvoice(null);
            router.push('/invoices/list');
          }}
        />
      )}
    </div>
  );
}
