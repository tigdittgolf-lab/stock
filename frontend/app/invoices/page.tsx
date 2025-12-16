'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  useEffect(() => {
    fetchClients();
    fetchArticles();
    fetchNextInvoiceNumber();
  }, []);

  const fetchNextInvoiceNumber = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch('http://localhost:3005/api/sales/invoices/next-number', {
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
      const response = await fetch('http://localhost:3005/api/sales/clients', {
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
      const response = await fetch('http://localhost:3005/api/articles', {
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
    // Si on supprime la ligne en cours de modification, annuler l'édition
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
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch('http://localhost:3005/api/sales/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenant
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
        const message = `✅ ${data.data.message || 'Facture créée avec succès!'}\n\n` +
                       `📋 Numéro: ${invoiceNumber}\n` +
                       `👤 Client: ${selectedClient}\n` +
                       `📅 Date: ${dateFacture}\n` +
                       `💰 Total HT: ${data.data.montant_ht?.toFixed(2)} DA\n` +
                       `💰 Total TTC: ${data.data.total_ttc?.toFixed(2)} DA\n` +
                       `📦 Articles: ${lines.length} ligne(s)`;
        
        alert(message);
        
        // Réinitialiser le formulaire
        setSelectedClient('');
        setDateFacture(new Date().toISOString().split('T')[0]);
        setLines([]);
        resetCurrentLine();
        
        // Rediriger vers la liste des factures après 2 secondes
        setTimeout(() => {
          router.push('/invoices/list');
        }, 2000);
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
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Créer une Facture {nextInvoiceNumber && `N° ${nextInvoiceNumber}`}</h1>
        <button onClick={() => router.push('/')}>Retour</button>
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
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.nclient} value={client.nclient}>
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
                  <option value="">Sélectionner un article</option>
                  {articles.map(article => (
                    <option key={article.narticle} value={article.narticle}>
                      {article.narticle} - {article.designation} (Stock Facture: {article.stock_f})
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
              Créer la Facture
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
