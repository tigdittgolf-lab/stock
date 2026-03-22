'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrintOptions from '../../components/PrintOptions';
import styles from '../page.module.css';

interface Client {
  nclient: string;
  raison_sociale: string;
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
  const [dateFacture, setDateFacture] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [currentLine, setCurrentLine] = useState({
    Narticle: '',
    Qte: 1,
    prix: 0,
    tva: 0
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<number | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<{
    id: number;
    number: number;
    clientName: string;
  } | null>(null);
  
  // Ã‰tats pour le paiement
  const [paymentType, setPaymentType] = useState<'total' | 'partial'>('total');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  useEffect(() => {
    fetchClients();
    fetchArticles();
    fetchNextInvoiceNumber();
  }, []);

  const fetchNextInvoiceNumber = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch(`/api/sales/invoices/next-number`, {
        headers: {
          'X-Tenant': tenant
        }
      });
      const data = await response.json();
      if (data.success) {
        setNextInvoiceNumber(data.data.next_number);
        console.log('Next invoice number:', data.data.next_number);
      }
    } catch (error) {
      console.error('Error fetching next invoice number:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch(`/api/sales/clients`, {
        headers: {
          'X-Tenant': tenant
        }
      });
      const data = await response.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchArticles = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch(`/api/articles`, {
        headers: {
          'X-Tenant': tenant
        }
      });
      const data = await response.json();
      if (data.success) {
        setArticles(data.data);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const handleArticleChange = (articleId: string) => {
    const article = articles.find(a => a.narticle === articleId);
    if (article) {
      // Si on est en mode Ã©dition et que l'article n'a pas changÃ©, ne pas Ã©craser les valeurs
      if (editingIndex !== null && currentLine.Narticle === articleId) {
        console.log('âš ï¸ Same article in edit mode, keeping current values');
        return;
      }
      
      setCurrentLine({
        ...currentLine,
        Narticle: articleId,
        prix: parseFloat(article.prix_vente.toString()) || 0,
        tva: parseFloat(article.tva.toString()) || 0
      });
    }
  };

  const addLine = () => {
    if (!currentLine.Narticle || currentLine.Qte <= 0) {
      alert('Veuillez sÃ©lectionner un article et une quantitÃ© valide');
      return;
    }

    const article = articles.find(a => a.narticle === currentLine.Narticle);
    if (!article) return;

    if (currentLine.Qte > article.stock_f) {
      alert(`Stock facture insuffisant! Stock facture disponible: ${article.stock_f}`);
      return;
    }

    const totalLigne = currentLine.Qte * currentLine.prix;
    const newLine: InvoiceLine = {
      Narticle: currentLine.Narticle,
      designation: article.designation,
      Qte: currentLine.Qte,
      prix: parseFloat(currentLine.prix.toString()) || 0,
      tva: parseFloat(currentLine.tva.toString()) || 0,
      total_ligne: totalLigne
    };

    if (editingIndex !== null) {
      // Mode modification : remplacer la ligne existante
      const updatedLines = [...lines];
      updatedLines[editingIndex] = newLine;
      setLines(updatedLines);
      console.log('Line updated at index:', editingIndex);
    } else {
      // Mode ajout : ajouter une nouvelle ligne
      setLines([...lines, newLine]);
    }
    
    // Reset form
    resetCurrentLine();
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
    // Si on supprime la ligne en cours de modification, annuler l'Ã©dition
    if (editingIndex === index) {
      setEditingIndex(null);
      resetCurrentLine();
    }
  };

  const editLine = (index: number) => {
    const lineToEdit = lines[index];
    setCurrentLine({
      Narticle: lineToEdit.Narticle,
      Qte: lineToEdit.Qte,
      prix: parseFloat(lineToEdit.prix.toString()) || 0,
      tva: parseFloat(lineToEdit.tva.toString()) || 0
    });
    setEditingIndex(index);
  };

  const resetCurrentLine = () => {
    setCurrentLine({
      Narticle: '',
      Qte: 1,
      prix: 0,
      tva: 0
    });
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    resetCurrentLine();
  };

  const calculateTotals = () => {
    const montantHT = lines.reduce((sum, line) => sum + parseFloat(line.total_ligne.toString()), 0);
    const totalTVA = lines.reduce((sum, line) => sum + (parseFloat(line.total_ligne.toString()) * parseFloat(line.tva.toString()) / 100), 0);
    const totalTTC = montantHT + totalTVA;

    return { montantHT, totalTVA, totalTTC };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient) {
      alert('Veuillez sÃ©lectionner un client');
      return;
    }

    if (lines.length === 0) {
      alert('Veuillez ajouter au moins une ligne');
      return;
    }

    try {
      // Utiliser selectedTenant au lieu de tenant
      const tenantInfo = localStorage.getItem('tenant_info');
      if (!tenantInfo) {
        alert('Erreur: Informations de tenant manquantes');
        return;
      }
      
      let tenant;
      try {
        tenant = JSON.parse(tenantInfo);
      } catch (e) {
        console.warn('Failed to parse tenant_info, using fallback:', e);
        tenant = { schema: localStorage.getItem('selectedTenant') || '2009_bu02' };
      }
      
      const tenantSchema = tenant.schema || localStorage.getItem('selectedTenant') || '2009_bu02';
      
      const dbConfig = localStorage.getItem('activeDbConfig');
      const databaseType = dbConfig ? JSON.parse(dbConfig).type : 'mysql';
      
      console.log('ðŸ“¤ Submitting Invoice with:', {
        tenant: tenantSchema,
        client: selectedClient,
        lines: lines.length,
        dbType: databaseType
      });
      
      const response = await fetch(`/api/sales/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantSchema,
          'X-Database-Type': databaseType
        },
        body: JSON.stringify({
          Nclient: selectedClient,
          date_fact: dateFacture,
          detail_fact: lines.map(line => ({
            Narticle: line.Narticle,
            Qte: line.Qte,
            prix: line.prix,
            tva: line.tva,
            pr_achat: 0
          }))
        }),
      });

      const data = await response.json();

      if (data.success) {
        const invoiceNumber = data.data.nfact;
        const totalTTC = data.data.total_ttc || 0;
        
        // Enregistrer le paiement si un montant est spÃ©cifiÃ©
        if (paymentType === 'total' || (paymentType === 'partial' && paymentAmount > 0)) {
          const amountToPay = paymentType === 'total' ? totalTTC : paymentAmount;
          
          try {
            const paymentResponse = await fetch(`/api/payments`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Tenant': tenantSchema,
                'X-Database-Type': databaseType
              },
              body: JSON.stringify({
                documentType: 'invoice',
                documentId: invoiceNumber,
                paymentDate: dateFacture,
                amount: amountToPay,
                paymentMethod: paymentMethod,
                notes: paymentNotes || null
              })
            });
            
            const paymentData = await paymentResponse.json();
            if (!paymentData.success) {
              console.error('âŒ Erreur lors de l\'enregistrement du paiement:', paymentData.error);
            } else {
              console.log('âœ… Paiement enregistrÃ© avec succÃ¨s');
            }
          } catch (paymentError) {
            console.error('âŒ Erreur lors de l\'enregistrement du paiement:', paymentError);
          }
        }
        
        const message = `âœ… ${data.data.message || 'Facture crÃ©Ã©e avec succÃ¨s!'}\n\n` +
                       `ðŸ“‹ NumÃ©ro: ${invoiceNumber}\n` +
                       `ðŸ‘¤ Client: ${selectedClient}\n` +
                       `ðŸ“… Date: ${dateFacture}\n` +
                       `ðŸ’° Total HT: ${data.data.montant_ht?.toFixed(2)} DA\n` +
                       `ðŸ’° Total TTC: ${totalTTC.toFixed(2)} DA\n` +
                       `ðŸ“¦ Articles: ${lines.length} ligne(s)`;
        
        // PrÃ©parer les donnÃ©es pour le modal d'impression
        const clientName = clients.find(c => c.nclient === selectedClient)?.raison_sociale || selectedClient;
        
        setCreatedInvoice({
          id: invoiceNumber,
          number: invoiceNumber,
          clientName: clientName
        });
        
        // RÃ©initialiser le formulaire
        setSelectedClient('');
        setDateFacture(new Date().toISOString().split('T')[0]);
        setLines([]);
        resetCurrentLine();
        setPaymentType('total');
        setPaymentAmount(0);
        setPaymentMethod('cash');
        setPaymentNotes('');
        
        // Afficher le modal d'impression
        setShowPrintModal(true);
      } else {
        alert('âŒ Erreur: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Erreur lors de la crÃ©ation de la facture');
    }
  };

  const totals = calculateTotals();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>CrÃ©er une Facture {nextInvoiceNumber && `NÂ° ${nextInvoiceNumber}`}</h1>
        <button onClick={() => router.push('/invoices/list')}>Retour</button>
      </header>

      <main className={styles.main}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formSection}>
            <h2>Informations Facture</h2>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Client:</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  required
                >
                  <option value="">SÃ©lectionner un client</option>
                  {clients.map((client, index) => (
                    <option key={`${client.nclient}-${index}`} value={client.nclient}>
                      {client.nclient} - {client.raison_sociale}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Date:</label>
                <input
                  type="date"
                  value={dateFacture}
                  onChange={(e) => setDateFacture(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h2>Ajouter des Articles</h2>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Article:</label>
                <select
                  value={currentLine.Narticle}
                  onChange={(e) => handleArticleChange(e.target.value)}
                >
                  <option value="">SÃ©lectionner un article</option>
                  {articles.map(article => (
                    <option key={article.narticle} value={article.narticle}>
                      {article.narticle} - {article.designation} (Stock Facture: {article.stock_f})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>QuantitÃ©:</label>
                <input
                  type="number"
                  min="1"
                  value={currentLine.Qte}
                  onChange={(e) => setCurrentLine({ ...currentLine, Qte: parseInt(e.target.value) || 1 })}
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Prix Unitaire:</label>
                <input
                  type="number"
                  step="0.01"
                  lang="en"
                  value={currentLine.prix}
                  onChange={(e) => setCurrentLine({ ...currentLine, prix: parseFloat(e.target.value) || 0 })}
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div className={styles.formGroup}>
                <label>TVA (%):</label>
                <input
                  type="number"
                  step="0.01"
                  lang="en"
                  value={currentLine.tva}
                  onChange={(e) => setCurrentLine({ ...currentLine, tva: parseFloat(e.target.value) || 0 })}
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <button type="button" onClick={addLine} className={styles.primaryButton}>
                {editingIndex !== null ? 'Modifier' : 'Ajouter'}
              </button>
              {editingIndex !== null && (
                <button type="button" onClick={cancelEdit} className={styles.secondaryButton}>
                  Annuler
                </button>
              )}
            </div>
          </div>

          <div className={styles.tableContainer}>
            <h2>Lignes de Facture</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Article</th>
                  <th>DÃ©signation</th>
                  <th>QuantitÃ©</th>
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
                    <td>{parseFloat(line.prix.toString()).toFixed(2)} DA</td>
                    <td>{parseFloat(line.tva.toString()).toFixed(0)}%</td>
                    <td>{parseFloat(line.total_ligne.toString()).toFixed(2)} DA</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => editLine(index)}
                        className={styles.editButton}
                        style={{ marginRight: '10px' }}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className={styles.deleteButton}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.totalsSection}>
            <div className={styles.totalRow}>
              <span>Montant HT:</span>
              <span>{totals.montantHT.toFixed(2)} DA</span>
            </div>
            <div className={styles.totalRow}>
              <span>TVA:</span>
              <span>{totals.totalTVA.toFixed(2)} DA</span>
            </div>
            <div className={styles.totalRow}>
              <strong>Total TTC:</strong>
              <strong>{totals.totalTTC.toFixed(2)} DA</strong>
            </div>
          </div>

          {/* Section Paiement */}
          <div className={styles.formSection}>
            <h2>ðŸ’° Paiement</h2>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Type de paiement:</label>
                <select
                  value={paymentType}
                  onChange={(e) => {
                    const type = e.target.value as 'total' | 'partial';
                    setPaymentType(type);
                    if (type === 'total') {
                      setPaymentAmount(totals.totalTTC);
                    }
                  }}
                >
                  <option value="total">Paiement total</option>
                  <option value="partial">Paiement partiel</option>
                </select>
              </div>

              {paymentType === 'partial' && (
                <div className={styles.formGroup}>
                  <label>Montant versÃ© (DA):</label>
                  <input
                    type="number"
                    step="0.01"
                    lang="en"
                    min="0"
                    max={totals.totalTTC}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0.00"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Total TTC: {totals.totalTTC.toFixed(2)} DA
                  </small>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>MÃ©thode de paiement:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">EspÃ¨ces</option>
                  <option value="check">ChÃ¨que</option>
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
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Ex: Premier versement, reste Ã  payer..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>
            )}

            {paymentType === 'partial' && paymentAmount > 0 && paymentAmount < totals.totalTTC && (
              <div style={{
                padding: '12px',
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                marginTop: '12px'
              }}>
                <strong>âš ï¸ Reste Ã  payer: {(totals.totalTTC - paymentAmount).toFixed(2)} DA</strong>
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryButton}>
              CrÃ©er la Facture
            </button>
            <button type="button" onClick={() => router.push('/invoices/list')} className={styles.secondaryButton}>
              Annuler
            </button>
          </div>
        </form>
      </main>
      
      {/* Modal d'impression aprÃ¨s crÃ©ation */}
      {showPrintModal && createdInvoice && (
        <PrintOptions
          documentType="invoice"
          documentId={createdInvoice.id}
          documentNumber={createdInvoice.number}
          clientName={createdInvoice.clientName}
          clientId={createdInvoice.clientId || selectedClient}
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

