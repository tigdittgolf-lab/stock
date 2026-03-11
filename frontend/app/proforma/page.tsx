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

interface ProformaLine {
  Narticle: string;
  designation: string;
  Qte: number;
  prix: number;
  tva: number;
  total_ligne: number;
}

export default function CreateProforma() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [dateProforma, setDateProforma] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<ProformaLine[]>([]);
  const [currentLine, setCurrentLine] = useState({
    Narticle: '',
    Qte: 1,
    prix: 0,
    tva: 0
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [nextProformaNumber, setNextProformaNumber] = useState<number | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [createdProforma, setCreatedProforma] = useState<{
    id: number;
    number: number;
    clientName: string;
  } | null>(null);

  useEffect(() => {
    fetchClients();
    fetchArticles();
    fetchNextProformaNumber();
  }, []);

  const fetchNextProformaNumber = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch(`/api/sales/proforma/next-number`, {
        headers: {
          'X-Tenant': tenant
        }
      });
      const data = await response.json();
      if (data.success) {
        setNextProformaNumber(data.data.next_number);
        console.log('Next proforma number:', data.data.next_number);
      }
    } catch (error) {
      console.error('Error fetching next proforma number:', error);
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
      console.log('Clients data:', data);
      if (data.success) {
        setClients(data.data);
        console.log('Clients loaded:', data.data.length);
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
      console.log('Articles data:', data);
      if (data.success) {
        setArticles(data.data);
        console.log('Articles loaded:', data.data.length);
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
        prix: parseFloat(article.prix_vente.toString()) || 0,
        tva: parseFloat(article.tva.toString()) || 0
      });
    }
  };

  const addLine = () => {
    if (!currentLine.Narticle || currentLine.Qte <= 0) {
      alert('Veuillez sélectionner un article et une quantité valide');
      return;
    }

    const article = articles.find(a => a.narticle === currentLine.Narticle);
    if (!article) return;

    const totalLigne = currentLine.Qte * currentLine.prix;
    const newLine: ProformaLine = {
      Narticle: currentLine.Narticle,
      designation: article.designation,
      Qte: currentLine.Qte,
      prix: parseFloat(currentLine.prix.toString()) || 0,
      tva: parseFloat(currentLine.tva.toString()) || 0,
      total_ligne: totalLigne
    };

    if (editingIndex !== null) {
      const updatedLines = [...lines];
      updatedLines[editingIndex] = newLine;
      setLines(updatedLines);
    } else {
      setLines([...lines, newLine]);
    }
    
    resetCurrentLine();
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
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
      alert('Veuillez sélectionner un client');
      return;
    }

    if (lines.length === 0) {
      alert('Veuillez ajouter au moins une ligne');
      return;
    }

    try {
      console.log('🚀 Sending proforma request...');
      
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch(`/api/sales/proforma`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenant
        },
        body: JSON.stringify({
          Nclient: selectedClient,
          date_fact: dateProforma,
          detail_proforma: lines.map(line => ({
            Narticle: line.Narticle,
            Qte: line.Qte,
            prix: line.prix,
            tva: line.tva,
            pr_achat: 0
          }))
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      // Lire la réponse comme texte d'abord pour voir ce qu'on reçoit
      const responseText = await response.text();
      console.log('📡 Raw response text:', responseText);
      
      // Essayer de parser le JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ JSON parsed successfully:', data);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('❌ Response text that failed to parse:', responseText);
        alert(`Erreur de parsing JSON: ${parseError instanceof Error ? parseError.message : 'Erreur inconnue'}\nRéponse reçue: ${responseText.substring(0, 100)}...`);
        return;
      }

      if (data.success) {
        const proformaNumber = data.data.nfprof;
        const message = `✅ ${data.data.message || 'Facture proforma créée avec succès!'}\n\n` +
                       `📋 Numéro: ${proformaNumber}\n` +
                       `👤 Client: ${selectedClient}\n` +
                       `📅 Date: ${dateProforma}\n` +
                       `💰 Total HT: ${data.data.montant_ht?.toFixed(2)} DA\n` +
                       `💰 Total TTC: ${data.data.total_ttc?.toFixed(2)} DA\n` +
                       `📦 Articles: ${lines.length} ligne(s)`;
        
        // Préparer les données pour le modal d'impression
        const clientName = clients.find(c => c.nclient === selectedClient)?.raison_sociale || selectedClient;
        
        setCreatedProforma({
          id: proformaNumber,
          number: proformaNumber,
          clientName: clientName
        });
        
        // Réinitialiser le formulaire
        setSelectedClient('');
        setDateProforma(new Date().toISOString().split('T')[0]);
        setLines([]);
        resetCurrentLine();
        
        // Afficher le modal d'impression
        setShowPrintModal(true);
      } else {
        alert('❌ Erreur: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating proforma:', error);
      alert('Erreur lors de la création de la facture proforma');
    }
  };

  const totals = calculateTotals();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Créer une Facture Proforma {nextProformaNumber && `N° ${nextProformaNumber}`}</h1>
        <button onClick={() => router.push('/dashboard')}>Retour</button>
      </header>

      <main className={styles.main}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formSection}>
            <h2>Informations Facture Proforma</h2>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Client:</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  required
                >
                  <option value="">Sélectionner un client</option>
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
                  value={dateProforma}
                  onChange={(e) => setDateProforma(e.target.value)}
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
                      {article.narticle} - {article.designation} (Prix: {parseFloat(article.prix_vente.toString()).toFixed(2)} DA)
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
                  onFocus={(e) => e.target.select()}
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
            <h2>Lignes de Facture Proforma</h2>
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

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryButton}>
              Créer la Facture Proforma
            </button>
            <button type="button" onClick={() => router.push('/dashboard')} className={styles.secondaryButton}>
              Annuler
            </button>
          </div>
        </form>
      </main>
      
      {/* Modal d'impression après création */}
      {showPrintModal && createdProforma && (
        <PrintOptions
          documentType="proforma"
          documentId={createdProforma.id}
          documentNumber={createdProforma.number}
          clientName={createdProforma.clientName}
          clientId={createdProforma.clientId || selectedClient}
          isModal={true}
          onClose={() => {
            setShowPrintModal(false);
            setCreatedProforma(null);
            router.push('/proforma/list');
          }}
        />
      )}
    </div>
  );
}