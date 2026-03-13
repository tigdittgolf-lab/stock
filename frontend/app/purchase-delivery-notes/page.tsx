'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';

interface Supplier {
  nfournisseur: string;
  nom_fournisseur: string;
}

interface Article {
  narticle: string;
  designation: string;
  prix_unitaire: number;
  tva: number;
  stock_f: number;
  stock_bl: number;
  nfournisseur: string;
}

interface DeliveryLine {
  Narticle: string;
  designation: string;
  Qte: number;
  prix: number;
  tva: number;
  total_ligne: number;
}

export default function CreatePurchaseDeliveryNote() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [dateBL, setDateBL] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<DeliveryLine[]>([]);
  const [currentLine, setCurrentLine] = useState({
    Narticle: '',
    Qte: 1,
    prix: 0,
    tva: 0
  });
  
  // États pour le paiement
  const [paymentType, setPaymentType] = useState<'total' | 'partial'>('total');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  useEffect(() => {
    fetchSuppliers();
    fetchArticles();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(getApiUrl('suppliers'));
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchArticles = async () => {
    try {
      const response = await fetch(getApiUrl('articles'));
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
      setCurrentLine({
        ...currentLine,
        Narticle: articleId,
        prix: article.prix_unitaire,
        tva: article.tva
      });
    }
  };

  const addLine = () => {
    if (!currentLine.Narticle || currentLine.Qte <= 0) {
      alert('Veuillez sélectionner un article et une quantité valide');
      return;
    }

    const article = articles.find(a => a.narticle === currentLine.Narticle);
    if (!article) {
      console.log('Article not found:', currentLine.Narticle);
      alert('Article non trouvé!');
      return;
    }

    const totalLigne = currentLine.Qte * currentLine.prix;
    const newLine: DeliveryLine = {
      Narticle: currentLine.Narticle,
      designation: article.designation,
      Qte: currentLine.Qte,
      prix: currentLine.prix,
      tva: currentLine.tva,
      total_ligne: totalLigne
    };

    setLines([...lines, newLine]);
    setCurrentLine({ Narticle: '', Qte: 1, prix: 0, tva: 0 });
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const montantHT = lines.reduce((sum, line) => sum + line.total_ligne, 0);
    const totalTVA = lines.reduce((sum, line) => sum + (line.total_ligne * line.tva / 100), 0);
    const totalTTC = montantHT + totalTVA;

    return { montantHT, totalTVA, totalTTC };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplier) {
      alert('Veuillez sélectionner un fournisseur');
      return;
    }

    if (lines.length === 0) {
      alert('Veuillez ajouter au moins une ligne');
      return;
    }

    try {
      const response = await fetch(getApiUrl('sales/purchases/delivery-notes'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Nfournisseur: selectedSupplier,
          date_fact: dateBL,
          bachat_detail: lines.map(line => ({
            Narticle: line.Narticle,
            Qte: line.Qte,
            prix: line.prix,
            tva: line.tva,
            facturer: false
          }))
        }),
      });

      const data = await response.json();

      if (data.success) {
        const blNumber = data.data.nbl || data.data.nfact;
        const totalTTC = data.data.total_ttc || totals.totalTTC;
        
        // Enregistrer le paiement si un montant est spécifié
        if (paymentType === 'total' || (paymentType === 'partial' && paymentAmount > 0)) {
          const amountToPay = paymentType === 'total' ? totalTTC : paymentAmount;
          
          try {
            const paymentResponse = await fetch(`/api/payments`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                documentType: 'purchase_delivery_note',
                documentId: blNumber,
                paymentDate: dateBL,
                amount: amountToPay,
                paymentMethod: paymentMethod,
                notes: paymentNotes || null
              })
            });
            
            const paymentData = await paymentResponse.json();
            if (!paymentData.success) {
              console.error('❌ Erreur lors de l\'enregistrement du paiement:', paymentData.error);
            } else {
              console.log('✅ Paiement enregistré avec succès');
            }
          } catch (paymentError) {
            console.error('❌ Erreur lors de l\'enregistrement du paiement:', paymentError);
          }
        }
        
        alert('Bon de livraison d\'achat créé avec succès!');
        
        // Réinitialiser le formulaire
        setSelectedSupplier('');
        setDateBL(new Date().toISOString().split('T')[0]);
        setLines([]);
        setCurrentLine({ Narticle: '', Qte: 1, prix: 0, tva: 0 });
        setPaymentType('total');
        setPaymentAmount(0);
        setPaymentMethod('cash');
        setPaymentNotes('');
        
        router.push('/');
      } else {
        alert('Erreur: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating purchase delivery note:', error);
      alert('Erreur lors de la création du bon de livraison');
    }
  };

  const totals = calculateTotals();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Créer un Bon de Livraison d'Achat</h1>
        <button onClick={() => router.push('/')}>Retour</button>
      </header>

      <main className={styles.main}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formSection}>
            <h2>Informations Bon de Livraison</h2>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Fournisseur:</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  required
                >
                  <option value="">Sélectionner un fournisseur</option>
                  {suppliers.map((supplier, index) => (
                    <option key={`${supplier.nfournisseur}-${index}`} value={supplier.nfournisseur}>
                      {supplier.nfournisseur} - {supplier.nom_fournisseur}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Date:</label>
                <input
                  type="date"
                  value={dateBL}
                  onChange={(e) => setDateBL(e.target.value)}
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
                  <option value="">Sélectionner un article</option>
                  {articles.map(article => (
                    <option key={article.narticle} value={article.narticle}>
                      {article.narticle} - {article.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Quantité:</label>
                <input
                  type="number"
                  min="1"
                  value={currentLine.Qte}
                  onChange={(e) => setCurrentLine({ ...currentLine, Qte: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Prix Unitaire:</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentLine.prix}
                  onChange={(e) => setCurrentLine({ ...currentLine, prix: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>TVA (%):</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentLine.tva}
                  readOnly
                />
              </div>

              <button type="button" onClick={addLine} className={styles.primaryButton}>
                Ajouter
              </button>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <h2>Lignes du Bon de Livraison</h2>
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
                    <td>{line.tva}%</td>
                    <td>{line.total_ligne.toFixed(2)} DA</td>
                    <td>
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

          {/* Section Paiement Fournisseur */}
          <div className={styles.formSection}>
            <h2>💰 Paiement Fournisseur</h2>
            
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
                  <label>Montant versé (DA):</label>
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
                <label>Méthode de paiement:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
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
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Ex: Premier versement, reste à payer..."
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
                <strong>⚠️ Dette restante: {(totals.totalTTC - paymentAmount).toFixed(2)} DA</strong>
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryButton}>
              Créer le Bon de Livraison
            </button>
            <button type="button" onClick={() => router.push('/')} className={styles.secondaryButton}>
              Annuler
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
