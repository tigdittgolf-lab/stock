'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrintOptions from '../../components/PrintOptions';
import styles from './delivery-notes.module.css';

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

interface DeliveryLine {
  Narticle: string;
  designation: string;
  Qte: number;
  prix: number;
  tva: number;
  total: number;
}

export default function CreateDeliveryNote() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedClientInfo, setSelectedClientInfo] = useState<Client | null>(null);
  const [selectedArticleInfo, setSelectedArticleInfo] = useState<Article | null>(null);
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
  
  // Ã‰tats pour le paiement
  const [paymentType, setPaymentType] = useState<'total' | 'partial'>('total');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  useEffect(() => {
    fetchClients();
    fetchArticles();
    fetchNextBLNumber();
  }, []);

  // Mettre Ã  jour les infos client quand sÃ©lectionnÃ©
  useEffect(() => {
    if (selectedClient) {
      // RÃ©cupÃ©rer les infos tenant depuis localStorage
      const tenantInfoStr = localStorage.getItem('tenant_info');
      let tenantInfo = null;
      
      try {
        if (tenantInfoStr) {
          tenantInfo = JSON.parse(tenantInfoStr);
        }
      } catch (e) {
        console.warn('Failed to parse tenant_info:', e);
      }
      
      // Fallback: utiliser selectedTenant si tenant_info n'existe pas
      const tenant = tenantInfo?.schema || localStorage.getItem('selectedTenant') || '2009_bu02';
      const dbType = tenantInfo?.database_type || 'supabase';
      
      // Appeler l'endpoint pour rÃ©cupÃ©rer les infos avec dette
      fetch(`/api/sales/clients/${selectedClient}/debt`, {
        headers: {
          'x-tenant': tenant,
          'x-database-type': dbType
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setSelectedClientInfo(data.data);
          } else {
            // Fallback: utiliser les donnÃ©es de base sans dette
            const client = clients.find(c => c.nclient === selectedClient);
            setSelectedClientInfo(client || null);
          }
        })
        .catch(err => {
          console.error('Error fetching client debt:', err);
          // Fallback: utiliser les donnÃ©es de base sans dette
          const client = clients.find(c => c.nclient === selectedClient);
          setSelectedClientInfo(client || null);
        });
    } else {
      setSelectedClientInfo(null);
    }
  }, [selectedClient, clients]);

  // Mettre Ã  jour les infos article quand sÃ©lectionnÃ©
  useEffect(() => {
    if (currentLine.Narticle) {
      const article = articles.find(a => a.narticle === currentLine.Narticle);
      setSelectedArticleInfo(article || null);
      if (article) {
        setCurrentLine(prev => ({
          ...prev,
          prix: article.prix_vente,
          tva: article.tva
        }));
      }
    } else {
      setSelectedArticleInfo(null);
    }
  }, [currentLine.Narticle, articles]);

  const fetchNextBLNumber = async () => {
    try {
      // RÃ©cupÃ©rer le tenant depuis localStorage
      const tenantInfo = localStorage.getItem('tenant_info');
      if (!tenantInfo) {
        console.warn('âš ï¸ No tenant info found, skipping next BL number fetch');
        return;
      }
      
      const tenant = JSON.parse(tenantInfo);
      const tenantId = tenant.schema || '2025_bu01';
      
      // RÃ©cupÃ©rer la config DB
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'mysql';
      
      console.log('ðŸ”¢ Fetching next BL number with:', { tenantId, dbType });
      
      const response = await fetch(`/api/sales/delivery-notes/next-number`, {
        headers: {
          'X-Tenant': tenantId,
          'X-Database-Type': dbType,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`âŒ Failed to fetch next BL number: ${response.status}`, errorData);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setNextBLNumber(data.data.next_number);
        console.log('âœ… Next BL number:', data.data.next_number);
      }
    } catch (error) {
      console.error('âŒ Error fetching next BL number:', error);
    }
  };

  const fetchClients = async () => {
    try {
      // RÃ©cupÃ©rer le tenant depuis localStorage
      const tenantInfo = localStorage.getItem('tenant_info');
      if (!tenantInfo) {
        console.warn('âš ï¸ No tenant info found');
        return;
      }
      
      const tenant = JSON.parse(tenantInfo);
      const tenantId = tenant.schema || '2025_bu01';
      
      // RÃ©cupÃ©rer la config DB
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'mysql';
      
      console.log('ðŸ‘¥ Fetching clients for tenant:', tenantId, 'dbType:', dbType);
      
      const response = await fetch(`/api/sales/clients`, {
        headers: {
          'X-Tenant': tenantId,
          'X-Database-Type': dbType
        }
      });
      const data = await response.json();
      console.log('ðŸ‘¥ Clients data:', data);
      if (data.success) {
        setClients(data.data);
        console.log('âœ… Clients loaded:', data.data.length);
      } else {
        console.error('âŒ Failed to load clients:', data.error);
      }
    } catch (error) {
      console.error('âŒ Error fetching clients:', error);
    }
  };

  const fetchArticles = async () => {
    try {
      // RÃ©cupÃ©rer le tenant depuis localStorage
      const tenantInfo = localStorage.getItem('tenant_info');
      if (!tenantInfo) {
        console.warn('âš ï¸ No tenant info found');
        return;
      }
      
      const tenant = JSON.parse(tenantInfo);
      const tenantId = tenant.schema || '2025_bu01';
      
      // RÃ©cupÃ©rer la config DB
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'mysql';
      
      console.log('ðŸ“¦ Fetching articles for tenant:', tenantId, 'dbType:', dbType);
      
      const response = await fetch(`/api/sales/articles`, {
        headers: {
          'X-Tenant': tenantId,
          'X-Database-Type': dbType
        }
      });
      const data = await response.json();
      console.log('ðŸ“¦ Articles data:', data);
      if (data.success) {
        setArticles(data.data);
        console.log('âœ… Articles loaded:', data.data.length);
      } else {
        console.error('âŒ Failed to load articles:', data.error);
      }
    } catch (error) {
      console.error('âŒ Error fetching articles:', error);
    }
  };

  const handleArticleChange = (articleId: string) => {
    console.log('Article selected:', articleId);
    const article = articles.find(a => a.narticle === articleId);
    console.log('Article found:', article);
    if (article) {
      // Si on est en mode Ã©dition et que l'article n'a pas changÃ©, ne pas Ã©craser les valeurs
      if (editingIndex !== null && currentLine.Narticle === articleId) {
        console.log('âš ï¸ Same article in edit mode, keeping current values');
        return;
      }
      
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
      alert('Veuillez sÃ©lectionner un article et une quantitÃ© valide');
      return;
    }

    console.log('Looking for article:', currentLine.Narticle);
    console.log('Available articles:', articles.map(a => a.narticle));
    
    const article = articles.find(a => a.narticle === currentLine.Narticle);
    if (!article) {
      console.log('Article not found:', currentLine.Narticle);
      alert('Article non trouvÃ©!');
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
      total: totalLigne
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
    const montantHT = lines.reduce((sum, line) => sum + parseFloat(line.total.toString()), 0);
    const totalTVA = lines.reduce((sum, line) => sum + (parseFloat(line.total.toString()) * parseFloat(line.tva.toString()) / 100), 0);
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
      
      const tenant = JSON.parse(tenantInfo);
      const tenantSchema = tenant.schema || localStorage.getItem('selectedTenant') || '2025_bu01';
      
      const dbConfig = localStorage.getItem('activeDbConfig');
      const databaseType = dbConfig ? JSON.parse(dbConfig).type : 'mysql';
      
      console.log('ðŸ“¤ Submitting BL with:', {
        tenant: tenantSchema,
        client: selectedClient,
        lines: lines.length,
        dbType: databaseType
      });
      
      const response = await fetch(`/api/sales/delivery-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantSchema,
          'X-Database-Type': databaseType
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
                documentType: 'delivery_note',
                documentId: blNumber,
                paymentDate: dateBL,
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
        
        const message = `âœ… ${data.data.message || 'Bon de livraison crÃ©Ã© avec succÃ¨s!'}\n\n` +
                       `ðŸ“‹ NumÃ©ro: ${blNumber}\n` +
                       `ðŸ‘¤ Client: ${selectedClient}\n` +
                       `ðŸ“… Date: ${dateBL}\n` +
                       `ðŸ’° Total HT: ${data.data.montant_ht?.toFixed(2)} DA\n` +
                       `ðŸ’° Total TTC: ${totalTTC.toFixed(2)} DA\n` +
                       `ðŸ“¦ Articles: ${lines.length} ligne(s)`;
        
        // PrÃ©parer les donnÃ©es pour le modal d'impression
        const clientName = clients.find(c => c.nclient === selectedClient)?.raison_sociale || selectedClient;
        
        setCreatedBL({
          id: blNumber,
          number: blNumber,
          clientName: clientName
        });
        
        // RÃ©initialiser le formulaire
        setSelectedClient('');
        setDateBL(new Date().toISOString().split('T')[0]);
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
      console.error('Error creating delivery note:', error);
      alert('Erreur lors de la crÃ©ation du bon de livraison');
    }
  };

  const totals = calculateTotals();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>
          CrÃ©er un Bon de Livraison 
          {nextBLNumber && <span className={styles.blNumber}>NÂ° {nextBLNumber}</span>}
        </div>
        <button onClick={() => router.push('/delivery-notes/list')} className={styles.backButton}>
          â† Retour
        </button>
      </header>

      <main className={styles.form}>
        <form onSubmit={handleSubmit}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Informations Bon de Livraison</h2>
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

            {/* Carte d'information client */}
            {selectedClientInfo && (
              <div className={`${styles.clientInfoCard} ${
                selectedClientInfo.solde && selectedClientInfo.solde > 0 
                  ? styles.warning 
                  : styles.success
              }`}>
                <div className={styles.clientInfoGrid}>
                  <div className={styles.clientInfoItem}>
                    <span className={styles.clientInfoLabel}>Raison Sociale</span>
                    <span className={styles.clientInfoValue}>{selectedClientInfo.raison_sociale}</span>
                  </div>
                  <div className={styles.clientInfoItem}>
                    <span className={styles.clientInfoLabel}>TÃ©lÃ©phone</span>
                    <span className={styles.clientInfoValue}>{selectedClientInfo.telephone || 'N/A'}</span>
                  </div>
                  <div className={styles.clientInfoItem}>
                    <span className={styles.clientInfoLabel}>CA Factures</span>
                    <span className={styles.clientInfoValue} style={{ color: '#17a2b8', fontWeight: 'bold' }}>
                      {selectedClientInfo.c_affaire_fact ? `${selectedClientInfo.c_affaire_fact.toFixed(2)} DA` : '0.00 DA'}
                    </span>
                  </div>
                  <div className={styles.clientInfoItem}>
                    <span className={styles.clientInfoLabel}>CA Bons de Livraison</span>
                    <span className={styles.clientInfoValue} style={{ color: '#17a2b8', fontWeight: 'bold' }}>
                      {selectedClientInfo.c_affaire_bl ? `${selectedClientInfo.c_affaire_bl.toFixed(2)} DA` : '0.00 DA'}
                    </span>
                  </div>
                  <div className={styles.clientInfoItem}>
                    <span className={styles.clientInfoLabel}>CA Total</span>
                    <span className={styles.clientInfoValue} style={{ color: '#28a745', fontWeight: 'bold', fontSize: '1.1em' }}>
                      {selectedClientInfo.chiffre_affaire ? `${selectedClientInfo.chiffre_affaire.toFixed(2)} DA` : '0.00 DA'}
                    </span>
                  </div>
                  <div className={styles.clientInfoItem}>
                    <span className={styles.clientInfoLabel}>Dette / Reste Ã  Payer</span>
                    <span className={styles.clientInfoValue} style={{ 
                      color: selectedClientInfo.solde && selectedClientInfo.solde > 0 ? '#dc3545' : '#28a745',
                      fontWeight: 'bold',
                      fontSize: '1.1em'
                    }}>
                      {selectedClientInfo.solde ? `${selectedClientInfo.solde.toFixed(2)} DA` : '0.00 DA'}
                    </span>
                    <span className={styles.clientStatus}>
                      {selectedClientInfo.solde && selectedClientInfo.solde > 0 
                        ? 'âš ï¸ Client endettÃ©' 
                        : 'âœ… Aucune dette'}
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
              <input
                type="date"
                value={dateBL}
                onChange={(e) => setDateBL(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Ajouter des Articles</h2>
            
            {/* Carte d'information article */}
            {selectedArticleInfo && (
              <div className={styles.articleInfoCard}>
                <div className={styles.articleInfoGrid}>
                  <div className={styles.articleInfoItem}>
                    <span className={styles.articleInfoLabel}>DÃ©signation</span>
                    <span className={styles.articleInfoValue}>{selectedArticleInfo.designation}</span>
                  </div>
                  <div className={styles.articleInfoItem}>
                    <span className={styles.articleInfoLabel}>Stock BL Disponible</span>
                    <span className={styles.articleInfoValue}>{selectedArticleInfo.stock_bl}</span>
                    <span className={`${styles.stockBadge} ${
                      selectedArticleInfo.stock_bl > 100 ? styles.high :
                      selectedArticleInfo.stock_bl > 20 ? styles.medium : styles.low
                    }`}>
                      {selectedArticleInfo.stock_bl > 100 ? 'âœ“ Stock Ã©levÃ©' :
                       selectedArticleInfo.stock_bl > 20 ? 'âš  Stock moyen' : 'âš ï¸ Stock faible'}
                    </span>
                  </div>
                  <div className={styles.articleInfoItem}>
                    <span className={styles.articleInfoLabel}>Stock Final</span>
                    <span className={styles.articleInfoValue}>{selectedArticleInfo.stock_f}</span>
                  </div>
                </div>
              </div>
            )}

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
                      {article.narticle} - {article.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>QuantitÃ©:</label>
                <input
                  type="number"
                  min="1"
                  max={selectedArticleInfo?.stock_bl || 999999}
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

              <button type="button" onClick={addLine} className={styles.addButton}>
                {editingIndex !== null ? 'âœ“ Modifier' : '+ Ajouter'}
              </button>
              
              {editingIndex !== null && (
                <button 
                  type="button" 
                  onClick={cancelEdit} 
                  style={{
                    padding: '12px 24px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                >
                  âœ• Annuler
                </button>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Lignes du Bon de Livraison</h2>
            {lines.length === 0 ? (
              <div className={styles.emptyState}>
                Aucune ligne ajoutÃ©e. SÃ©lectionnez un article ci-dessus pour commencer.
              </div>
            ) : (
              <>
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
                        <td>{parseFloat(line.total.toString()).toFixed(2)} DA</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => editLine(index)}
                              style={{
                                padding: '8px 16px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                              }}
                            >
                              âœï¸ Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => removeLine(index)}
                              className={styles.deleteButton}
                            >
                              ðŸ—‘ Supprimer
                            </button>
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

          {/* Section Paiement */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>ðŸ’° Paiement</h2>
            
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

          <div className={styles.actions}>
            <button 
              type="button" 
              onClick={() => router.push('/delivery-notes/list')} 
              className={styles.cancelButton}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={lines.length === 0 || !selectedClient}
            >
              âœ“ CrÃ©er le Bon de Livraison
            </button>
          </div>
        </form>
      </main>
      
      {/* Modal d'impression aprÃ¨s crÃ©ation */}
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

