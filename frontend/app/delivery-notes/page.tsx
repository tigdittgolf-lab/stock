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

interface DeliveryLine {
  Narticle: string;
  designation: string;
  Qte: number;
  prix: number;
  tva: number;
  total_ligne: number;
}

export default function CreateDeliveryNote() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [dateBL, setDateBL] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<DeliveryLine[]>([]);
  const [currentLine, setCurrentLine] = useState({
    Narticle: '',
    Qte: 1,
    prix: 0,
    tva: 0
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [nextBLNumber, setNextBLNumber] = useState<number | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [createdBL, setCreatedBL] = useState<{
    id: number;
    number: number;
    clientName: string;
  } | null>(null);

  useEffect(() => {
    fetchClients();
    fetchArticles();
    fetchNextBLNumber();
  }, []);

  const fetchNextBLNumber = async () => {
    try {
      const response = await fetch(`http://localhost:3005/api/sales/delivery-notes/next-number`, {
        headers: {
          'X-Tenant': '2025_bu01'
        }
      });
      const data = await response.json();
      if (data.success) {
        setNextBLNumber(data.data.next_number);
        console.log('Next BL number:', data.data.next_number);
      }
    } catch (error) {
      console.error('Error fetching next BL number:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch(`http://localhost:3005/api/sales/clients`, {
        headers: {
          'X-Tenant': '2025_bu01'
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
      const response = await fetch(`http://localhost:3005/api/sales/articles`, {
        headers: {
          'X-Tenant': '2025_bu01'
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
    console.log('Article selected:', articleId);
    const article = articles.find(a => a.narticle === articleId);
    console.log('Article found:', article);
    if (article) {
      const newLine = {
        ...currentLine,
        Narticle: articleId,
        prix: parseFloat(article.prix_vente.toString()) || 0,
        tva: parseFloat(article.tva.toString()) || 0
      };
      console.log('Setting current line:', newLine);
      setCurrentLine(newLine);
    }
  };

  const addLine = () => {
    console.log('addLine called, currentLine:', currentLine);
    
    if (!currentLine.Narticle || currentLine.Qte <= 0) {
      alert('Veuillez sélectionner un article et une quantité valide');
      return;
    }

    console.log('Looking for article:', currentLine.Narticle);
    console.log('Available articles:', articles.map(a => a.narticle));
    
    const article = articles.find(a => a.narticle === currentLine.Narticle);
    if (!article) {
      console.log('Article not found:', currentLine.Narticle);
      alert('Article non trouvé!');
      return;
    }

    console.log('Article found:', article);

    if (currentLine.Qte > article.stock_bl) {
      alert(`Stock BL insuffisant! Stock BL disponible: ${article.stock_bl}`);
      return;
    }

    const totalLigne = currentLine.Qte * currentLine.prix;
    const newLine: DeliveryLine = {
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
      console.log('Adding line:', newLine);
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
      const response = await fetch(`http://localhost:3005/api/sales/delivery-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': '2025_bu01'
        },
        body: JSON.stringify({
          Nclient: selectedClient,
          date_fact: dateBL,
          detail_bl: lines.map(line => ({
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
        const message = `✅ ${data.data.message || 'Bon de livraison créé avec succès!'}\n\n` +
                       `📋 Numéro: ${blNumber}\n` +
                       `👤 Client: ${selectedClient}\n` +
                       `📅 Date: ${dateBL}\n` +
                       `💰 Total HT: ${data.data.montant_ht?.toFixed(2)} DA\n` +
                       `💰 Total TTC: ${data.data.total_ttc?.toFixed(2)} DA\n` +
                       `📦 Articles: ${lines.length} ligne(s)`;
        
        // Préparer les données pour le modal d'impression
        const clientName = clients.find(c => c.nclient === selectedClient)?.raison_sociale || selectedClient;
        
        setCreatedBL({
          id: blNumber,
          number: blNumber,
          clientName: clientName
        });
        
        // Réinitialiser le formulaire
        setSelectedClient('');
        setDateBL(new Date().toISOString().split('T')[0]);
        setLines([]);
        resetCurrentLine();
        
        // Afficher le modal d'impression
        setShowPrintModal(true);
      } else {
        alert('❌ Erreur: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating delivery note:', error);
      alert('Erreur lors de la création du bon de livraison');
    }
  };

  const totals = calculateTotals();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Créer un Bon de Livraison {nextBLNumber && `N° ${nextBLNumber}`}</h1>
        <button onClick={() => router.push('/')}>Retour</button>
      </header>

      <main className={styles.main}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formSection}>
            <h2>Informations Bon de Livraison</h2>
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
                      {article.narticle} - {article.designation} (Stock BL: {article.stock_bl})
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
              Créer le Bon de Livraison
            </button>
            <button type="button" onClick={() => router.push('/')} className={styles.secondaryButton}>
              Annuler
            </button>
          </div>
        </form>
      </main>
      
      {/* Modal d'impression après création */}
      {showPrintModal && createdBL && (
        <PrintOptions
          documentType="bl"
          documentId={createdBL.id}
          documentNumber={createdBL.number}
          clientName={createdBL.clientName}
          clientId={createdBL.clientId || selectedClient}
          isModal={true}
          onClose={() => {
            setShowPrintModal(false);
            setCreatedBL(null);
            router.push('/delivery-notes/list');
          }}
        />
      )}
    </div>
  );
}
