'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';

interface Supplier {
  nfournisseur: string;
  nom_fournisseur: string;
  adresse_fourni: string;
}

interface Article {
  narticle: string;
  designation: string;
  prix_unitaire: number;
  stock_f: number;
  stock_bl: number;
  nfournisseur: string;
}

interface PurchaseDetail {
  Narticle: string;
  Qte: number;
  prix: number;
  tva: number;
}

export default function CreatePurchaseInvoice() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [details, setDetails] = useState<PurchaseDetail[]>([
    { Narticle: '', Qte: 1, prix: 0, tva: 19 }
  ]);
  
  // Articles filtrés par fournisseur sélectionné
  const filteredArticles = selectedSupplier 
    ? articles.filter(article => article.nfournisseur === selectedSupplier)
    : [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSuppliers();
    fetchArticles();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch('getApiUrl('sales/suppliers')', {
        headers: {
          'X-Tenant': tenant
        }
      });
      
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
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch('getApiUrl('sales/articles')', {
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

  const addDetail = () => {
    setDetails([...details, { Narticle: '', Qte: 1, prix: 0, tva: 19 }]);
  };

  const removeDetail = (index: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
    }
  };

  const updateDetail = (index: number, field: keyof PurchaseDetail, value: string | number) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    
    // Auto-fill price from article data (utiliser les articles filtrés)
    if (field === 'Narticle') {
      const article = filteredArticles.find(a => a.narticle === value);
      if (article) {
        newDetails[index].prix = article.prix_unitaire || 0;
      }
    }
    
    setDetails(newDetails);
  };

  // Réinitialiser les détails quand le fournisseur change
  const handleSupplierChange = (newSupplier: string) => {
    setSelectedSupplier(newSupplier);
    // Réinitialiser les articles sélectionnés car ils ne sont plus valides
    setDetails([{ Narticle: '', Qte: 1, prix: 0, tva: 19 }]);
  };

  const calculateTotal = () => {
    return details.reduce((total, detail) => {
      const lineTotal = detail.Qte * detail.prix;
      const tvaAmount = lineTotal * (detail.tva / 100);
      return total + lineTotal + tvaAmount;
    }, 0);
  };

  const calculateHT = () => {
    return details.reduce((total, detail) => {
      return total + (detail.Qte * detail.prix);
    }, 0);
  };

  const calculateTVA = () => {
    return details.reduce((total, detail) => {
      const lineTotal = detail.Qte * detail.prix;
      return total + (lineTotal * (detail.tva / 100));
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSupplier) {
      setError('Veuillez sélectionner un fournisseur');
      return;
    }

    if (!invoiceNumber.trim()) {
      setError('Veuillez saisir le numéro de facture du fournisseur');
      return;
    }

    if (details.some(d => !d.Narticle || d.Qte <= 0 || d.prix <= 0)) {
      setError('Veuillez remplir tous les détails correctement');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch('getApiUrl('purchases/invoices')', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenant
        },
        body: JSON.stringify({
          Nfournisseur: selectedSupplier,
          numero_facture_fournisseur: invoiceNumber,
          date_fact: invoiceDate,
          detail_fact_achat: details
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Facture d'achat ${data.data.nfact_achat} créée avec succès !`);
        // Reset form
        setSelectedSupplier('');
        setInvoiceNumber('');
        setDetails([{ Narticle: '', Qte: 1, prix: 0, tva: 19 }]);
        setInvoiceDate(new Date().toISOString().split('T')[0]);
      } else {
        setError(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error creating purchase invoice:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Nouvelle Facture d'Achat</h1>
        <div>
          <button onClick={() => router.push('/purchases/delivery-notes')} className={styles.primaryButton}>
            BL d'Achat
          </button>
          <button onClick={() => router.push('/purchases/invoices/list')} className={styles.secondaryButton}>
            Liste des Factures
          </button>
          <button onClick={() => router.push('/')} className={styles.secondaryButton}>
            Retour
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <form onSubmit={handleSubmit}>
          {/* Informations générales */}
          <div className={styles.formSection}>
            <h2>Informations Générales</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Fournisseur *</label>
                <select 
                  value={selectedSupplier} 
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  required
                >
                  <option value="">Sélectionner un fournisseur</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.nfournisseur} value={supplier.nfournisseur}>
                      {supplier.nom_fournisseur} ({supplier.nfournisseur})
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
          </div>

          {/* Détails des articles */}
          <div className={styles.formSection}>
            <h2>Articles Achetés</h2>
            {selectedSupplier && (
              <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1976d2' }}>
                  📦 <strong>{filteredArticles.length}</strong> article{filteredArticles.length > 1 ? 's' : ''} disponible{filteredArticles.length > 1 ? 's' : ''} pour le fournisseur <strong>{suppliers.find(s => s.nfournisseur === selectedSupplier)?.nom_fournisseur || selectedSupplier}</strong>
                </p>
              </div>
            )}
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Quantité</th>
                    <th>Prix Unitaire (DA)</th>
                    <th>TVA (%)</th>
                    <th>Total Ligne</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((detail, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          value={detail.Narticle}
                          onChange={(e) => updateDetail(index, 'Narticle', e.target.value)}
                          required
                          disabled={!selectedSupplier}
                        >
                          <option value="">
                            {!selectedSupplier 
                              ? "Sélectionner d'abord un fournisseur" 
                              : filteredArticles.length === 0 
                                ? "Aucun article pour ce fournisseur"
                                : "Sélectionner un article"
                            }
                          </option>
                          {filteredArticles.map(article => (
                            <option key={article.narticle} value={article.narticle}>
                              {article.designation} ({article.narticle}) - Stock: {article.stock_f}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={detail.Qte}
                          onChange={(e) => updateDetail(index, 'Qte', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={detail.prix}
                          onChange={(e) => updateDetail(index, 'prix', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={detail.tva}
                          onChange={(e) => updateDetail(index, 'tva', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {((detail.Qte * detail.prix) * (1 + detail.tva / 100)).toFixed(2)} DA
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => removeDetail(index)}
                          className={styles.deleteButton}
                          disabled={details.length === 1}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addDetail} className={styles.secondaryButton}>
              Ajouter un Article
            </button>
          </div>

          {/* Totaux */}
          <div className={styles.totalsSection}>
            <div className={styles.totalsGrid}>
              <div className={styles.totalRow}>
                <span>Montant HT :</span>
                <span>{calculateHT().toFixed(2)} DA</span>
              </div>
              <div className={styles.totalRow}>
                <span>TVA :</span>
                <span>{calculateTVA().toFixed(2)} DA</span>
              </div>
              <div className={styles.totalRow}>
                <strong>Total TTC :</strong>
                <strong>{calculateTotal().toFixed(2)} DA</strong>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className={styles.error}>
              <p>❌ {error}</p>
            </div>
          )}

          {success && (
            <div className={styles.success}>
              <p>✅ {success}</p>
            </div>
          )}

          {/* Actions */}
          <div className={styles.formActions}>
            <button type="submit" disabled={loading} className={styles.primaryButton}>
              {loading ? 'Création...' : 'Créer la Facture d\'Achat'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}