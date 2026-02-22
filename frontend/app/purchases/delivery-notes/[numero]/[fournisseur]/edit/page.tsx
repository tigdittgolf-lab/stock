'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import styles from '../../../../../page.module.css';

interface Article {
  narticle: string;
  designation: string;
  prix_achat: number;
  tva: number;
}

interface Supplier {
  Nfournisseur: string;
  Nom_fournisseur: string;
}

interface BLDetail {
  narticle: string;
  designation: string;
  qte: number;
  prix: number;
  tva: number;
  total_ligne: number;
}

interface PageProps {
  params: Promise<{ numero: string; fournisseur: string }>;
}

export default function EditPurchaseBLPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const numero = resolvedParams.numero;
  const fournisseur = resolvedParams.fournisseur;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [dateBL, setDateBL] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [details, setDetails] = useState<BLDetail[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    fetchData();
  }, [numero, fournisseur]);

  const fetchData = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      
      // Récupérer le BL
      const blResponse = await fetch(getApiUrl(`purchases/delivery-notes/${encodeURIComponent(numero)}/${encodeURIComponent(fournisseur)}`), {
        headers: { 'X-Tenant': tenant }
      });
      
      const blData = await blResponse.json();
      if (blData.success) {
        const bl = blData.data;
        setDateBL(bl.date_bl.split('T')[0]);
        setSupplierName(bl.supplier_name);
        setDetails(bl.details || []);
      } else {
        setError('BL non trouvé');
      }

      // Récupérer les articles
      const articlesResponse = await fetch(getApiUrl('sales/articles'), {
        headers: { 'X-Tenant': tenant }
      });
      const articlesData = await articlesResponse.json();
      if (articlesData.success) {
        setArticles(articlesData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDetail = (index: number, field: keyof BLDetail, value: any) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    
    if (field === 'qte' || field === 'prix' || field === 'tva') {
      const qte = parseFloat(newDetails[index].qte as any) || 0;
      const prix = parseFloat(newDetails[index].prix as any) || 0;
      const tva = parseFloat(newDetails[index].tva as any) || 0;
      newDetails[index].total_ligne = qte * prix * (1 + tva / 100);
    }
    
    setDetails(newDetails);
  };

  const handleAddDetail = () => {
    setDetails([...details, {
      narticle: '',
      designation: '',
      qte: 0,
      prix: 0,
      tva: 19,
      total_ligne: 0
    }]);
  };

  const handleRemoveDetail = (index: number) => {
    setDetails(details.filter((_, i) => i !== index));
  };

  const handleArticleSelect = (index: number, narticle: string) => {
    const article = articles.find(a => a.narticle === narticle);
    console.log('🔍 Article sélectionné:', article);
    if (article) {
      const newDetails = [...details];
      const prix = article.prix_achat || article.prix_unitaire || article.prix_vente || 0;
      const tva = article.tva || 19;
      console.log('💰 Prix trouvé:', prix, 'TVA:', tva);
      
      newDetails[index] = {
        ...newDetails[index],
        narticle: narticle,
        designation: article.designation,
        prix: prix,
        tva: tva
      };
      
      // Recalculer le total de la ligne
      const qte = parseFloat(newDetails[index].qte as any) || 0;
      newDetails[index].total_ligne = qte * prix * (1 + tva / 100);
      
      setDetails(newDetails);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (details.length === 0) {
      setError('Ajoutez au moins un article');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      
      const response = await fetch(getApiUrl(`purchases/delivery-notes/${encodeURIComponent(numero)}/${encodeURIComponent(fournisseur)}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenant
        },
        body: JSON.stringify({
          date_bl: dateBL,
          details: details.map(d => ({
            Narticle: d.narticle,
            Qte: d.qte,
            prix: d.prix,
            tva: d.tva
          }))
        })
      });

      const data = await response.json();
      
      if (data.success) {
        router.push(`/purchases/delivery-notes/${encodeURIComponent(numero)}/${encodeURIComponent(fournisseur)}`);
      } else {
        setError(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating BL:', error);
      setError('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  const calculateTotals = () => {
    const montant_ht = details.reduce((sum, d) => sum + (d.qte * d.prix), 0);
    const tva = details.reduce((sum, d) => sum + (d.qte * d.prix * d.tva / 100), 0);
    return { montant_ht, tva, total_ttc: montant_ht + tva };
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className={styles.page} style={{ paddingTop: '20px' }}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  return (
    <div className={styles.page} style={{ paddingTop: '20px' }}>
      <header className={styles.header}>
        <h1>✏️ Modifier BL d'Achat - {numero}</h1>
        <button onClick={() => router.back()} className={styles.secondaryButton}>
          Annuler
        </button>
      </header>

      <main className={styles.main}>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className={styles.error} style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div className={styles.invoiceSection}>
            <h2>Informations Générales</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div className={styles.invoiceField}>
                <label>N° BL Fournisseur:</label>
                <input type="text" value={numero} disabled style={{ backgroundColor: 'var(--background-secondary)', cursor: 'not-allowed' }} />
              </div>
              <div className={styles.invoiceField}>
                <label>Fournisseur:</label>
                <input type="text" value={`${supplierName} (${fournisseur})`} disabled style={{ backgroundColor: 'var(--background-secondary)', cursor: 'not-allowed' }} />
              </div>
              <div className={styles.invoiceField}>
                <label>Date de BL:</label>
                <input
                  type="date"
                  value={dateBL}
                  onChange={(e) => setDateBL(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className={styles.invoiceSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Articles</h2>
              <button type="button" onClick={handleAddDetail} className={styles.primaryButton}>
                + Ajouter un article
              </button>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Désignation</th>
                    <th style={{ textAlign: 'right' }}>Quantité</th>
                    <th style={{ textAlign: 'right' }}>Prix</th>
                    <th style={{ textAlign: 'right' }}>TVA (%)</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((detail, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          value={detail.narticle}
                          onChange={(e) => handleArticleSelect(index, e.target.value)}
                          required
                          style={{ width: '100%', padding: '0.5rem' }}
                        >
                          <option value="">Sélectionner un article...</option>
                          {articles.map(article => (
                            <option key={article.narticle} value={article.narticle}>
                              {article.designation} ({article.narticle})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{detail.designation}</td>
                      <td>
                        <input
                          type="number"
                          value={isNaN(detail.qte) ? '' : detail.qte}
                          onChange={(e) => handleUpdateDetail(index, 'qte', parseFloat(e.target.value))}
                          min="0"
                          step="0.01"
                          required
                          style={{ width: '100%', textAlign: 'right', padding: '0.5rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={isNaN(detail.prix) ? '' : detail.prix}
                          onChange={(e) => handleUpdateDetail(index, 'prix', parseFloat(e.target.value))}
                          min="0"
                          step="0.01"
                          required
                          style={{ width: '100%', textAlign: 'right', padding: '0.5rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={isNaN(detail.tva) ? '' : detail.tva}
                          onChange={(e) => handleUpdateDetail(index, 'tva', parseFloat(e.target.value))}
                          min="0"
                          step="0.01"
                          required
                          style={{ width: '100%', textAlign: 'right', padding: '0.5rem' }}
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {detail.total_ligne.toFixed(2)} DA
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleRemoveDetail(index)}
                          className={styles.secondaryButton}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                  {details.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                        Aucun article. Cliquez sur "Ajouter un article" pour commencer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.invoiceSection}>
            <h2>Totaux</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--success-bg)', borderRadius: '8px', border: '1px solid var(--success-border)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Montant HT</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-text)' }}>
                  {totals.montant_ht.toFixed(2)} DA
                </div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'var(--warning-bg)', borderRadius: '8px', border: '1px solid var(--warning-border)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>TVA</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning-text)' }}>
                  {totals.tva.toFixed(2)} DA
                </div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'var(--info-bg)', borderRadius: '8px', border: '1px solid var(--info-border)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total TTC</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--info-text)' }}>
                  {totals.total_ttc.toFixed(2)} DA
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button
              type="button"
              onClick={() => router.back()}
              className={styles.secondaryButton}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || details.length === 0}
              className={styles.primaryButton}
            >
              {saving ? 'Enregistrement...' : '💾 Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
