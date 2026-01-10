'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../../page.module.css';

interface Article {
  narticle: string;
  designation: string;
  prix_vente: number;
}

interface Client {
  nclient: string;
  raison_sociale: string;
}

interface DeliveryNoteDetail {
  narticle: string;
  designation?: string;
  qte: number;
  prix: number;
  tva: number;
  total_ligne: number;
}

interface DeliveryNote {
  nbl?: number;
  nfact?: number;
  nclient: string;
  client_name?: string;
  date_fact: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  details?: DeliveryNoteDetail[];
}

export default function EditDeliveryNote({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  
  const [deliveryNote, setDeliveryNote] = useState<DeliveryNote | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [selectedClient, setSelectedClient] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [details, setDetails] = useState<DeliveryNoteDetail[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      
      // Charger le BL existant
      const blResponse = await fetch(`/api/sales/delivery-notes/${resolvedParams.id}`, {
        headers: { 'X-Tenant': tenant }
      });
      
      if (!blResponse.ok) {
        throw new Error('BL non trouvé');
      }
      
      const blData = await blResponse.json();
      if (blData.success && blData.data) {
        const bl = blData.data;
        setDeliveryNote(bl);
        setSelectedClient(bl.nclient);
        setDeliveryDate(bl.date_fact.split('T')[0]); // Format YYYY-MM-DD
        setDetails(bl.details || []);
      }

      // Charger les clients
      const clientsResponse = await fetch('/api/sales/clients', {
        headers: { 'X-Tenant': tenant }
      });
      
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        if (clientsData.success) {
          setClients(clientsData.data || []);
        }
      }

      // Charger les articles
      const articlesResponse = await fetch('/api/sales/articles', {
        headers: { 'X-Tenant': tenant }
      });
      
      if (articlesResponse.ok) {
        const articlesData = await articlesResponse.json();
        if (articlesData.success) {
          setArticles(articlesData.data || []);
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const addDetail = () => {
    setDetails([...details, {
      narticle: '',
      designation: '',
      qte: 1,
      prix: 0,
      tva: 19,
      total_ligne: 0
    }]);
  };

  const removeDetail = (index: number) => {
    setDetails(details.filter((_, i) => i !== index));
  };

  const updateDetail = (index: number, field: keyof DeliveryNoteDetail, value: any) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    
    // Si on change l'article, mettre à jour la désignation et le prix
    if (field === 'narticle') {
      const article = articles.find(a => a.narticle === value);
      if (article) {
        newDetails[index].designation = article.designation;
        newDetails[index].prix = article.prix_vente;
      }
    }
    
    // Recalculer le total de la ligne
    const detail = newDetails[index];
    const qte = parseFloat(detail.qte.toString()) || 0;
    const prix = parseFloat(detail.prix.toString()) || 0;
    const tva_rate = parseFloat(detail.tva.toString()) || 19;
    
    const total_ht = qte * prix;
    const tva_amount = total_ht * (tva_rate / 100);
    newDetails[index].total_ligne = total_ht + tva_amount;
    
    setDetails(newDetails);
  };

  const calculateTotals = () => {
    let montant_ht = 0;
    let tva_total = 0;
    
    details.forEach(detail => {
      const qte = parseFloat(detail.qte.toString()) || 0;
      const prix = parseFloat(detail.prix.toString()) || 0;
      const tva_rate = parseFloat(detail.tva.toString()) || 19;
      
      const total_ht = qte * prix;
      const tva_amount = total_ht * (tva_rate / 100);
      
      montant_ht += total_ht;
      tva_total += tva_amount;
    });
    
    return {
      montant_ht: montant_ht,
      tva: tva_total,
      montant_ttc: montant_ht + tva_total
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !deliveryDate || details.length === 0) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      
      const formData = {
        Nclient: selectedClient,
        date_fact: deliveryDate,
        detail_bl: details.map(detail => ({
          narticle: detail.narticle,
          qte: parseFloat(detail.qte.toString()),
          prix: parseFloat(detail.prix.toString()),
          tva: parseFloat(detail.tva.toString())
        }))
      };

      const response = await fetch(`/api/sales/delivery-notes/${resolvedParams.id}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenant
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ BL modifié avec succès');
        router.push(`/delivery-notes/${resolvedParams.id}`);
      } else {
        setError(result.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Error updating BL:', error);
      setError('Erreur lors de la modification du BL');
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  if (!deliveryNote) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>BL non trouvé</h1>
          <button onClick={() => router.push('/delivery-notes/list')} className={styles.secondaryButton}>
            Retour à la liste
          </button>
        </header>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Modifier BL N° {deliveryNote.nbl || deliveryNote.nfact}</h1>
        <div>
          <button onClick={() => router.push(`/delivery-notes/${resolvedParams.id}`)} className={styles.secondaryButton}>
            Annuler
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.formSection}>
            <h2>Informations générales</h2>
            
            <div className={styles.formGroup}>
              <label>Client *</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                required
                className={styles.select}
              >
                <option value="">Sélectionner un client</option>
                {clients.map(client => (
                  <option key={client.nclient} value={client.nclient}>
                    {client.nclient} - {client.raison_sociale}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Date de livraison *</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Articles</h2>
              <button type="button" onClick={addDetail} className={styles.primaryButton}>
                + Ajouter un article
              </button>
            </div>

            {details.length === 0 ? (
              <p>Aucun article ajouté</p>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Désignation</th>
                      <th>Quantité</th>
                      <th>Prix unitaire</th>
                      <th>TVA (%)</th>
                      <th>Total ligne</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((detail, index) => (
                      <tr key={index}>
                        <td>
                          <select
                            value={detail.narticle}
                            onChange={(e) => updateDetail(index, 'narticle', e.target.value)}
                            className={styles.select}
                          >
                            <option value="">Sélectionner</option>
                            {articles.map(article => (
                              <option key={article.narticle} value={article.narticle}>
                                {article.narticle}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={detail.designation || ''}
                            onChange={(e) => updateDetail(index, 'designation', e.target.value)}
                            className={styles.input}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={detail.qte}
                            onChange={(e) => updateDetail(index, 'qte', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className={styles.input}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={detail.prix}
                            onChange={(e) => updateDetail(index, 'prix', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className={styles.input}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={detail.tva}
                            onChange={(e) => updateDetail(index, 'tva', parseFloat(e.target.value) || 19)}
                            min="0"
                            max="100"
                            step="0.01"
                            className={styles.input}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {detail.total_ligne.toFixed(2)} DA
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeDetail(index)}
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
            )}
          </div>

          <div className={styles.totalsSection}>
            <div className={styles.totalsGrid}>
              <div className={styles.totalRow}>
                <span>Montant HT :</span>
                <span>{totals.montant_ht.toFixed(2)} DA</span>
              </div>
              <div className={styles.totalRow}>
                <span>TVA :</span>
                <span>{totals.tva.toFixed(2)} DA</span>
              </div>
              <div className={styles.totalRow}>
                <strong>Total TTC :</strong>
                <strong>{totals.montant_ttc.toFixed(2)} DA</strong>
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => router.push(`/delivery-notes/${resolvedParams.id}`)}
              className={styles.secondaryButton}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || details.length === 0}
              className={styles.primaryButton}
            >
              {saving ? 'Modification...' : 'Modifier le BL'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}