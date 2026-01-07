'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrintOptions from '../../../components/PrintOptions';
import styles from '../../page.module.css';

interface Proforma {
  nfact?: number;
  nfprof?: number;
  nclient: string;
  client_name?: string;
  date_fact: string;
  montant_ht: number | string;
  tva: number | string;
  montant_ttc: number | string;
  created_at: string;
}

export default function ProformaList() {
  const router = useRouter();
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [filteredProformas, setFilteredProformas] = useState<Proforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Détecter si on est sur mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchProformas();
  }, []);

  const fetchProformas = async () => {
    try {
      const tenantInfo = localStorage.getItem('tenant_info');
      if (!tenantInfo) {
        router.push('/login');
        return;
      }

      const tenant = JSON.parse(tenantInfo);
      const response = await fetch('/api/sales/proformas', {
        headers: {
          'X-Tenant': tenant.schema,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setProformas(data.data || []);
        setFilteredProformas(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching proformas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction de filtrage améliorée - MÊME LOGIQUE QUE LES BL
  const applyFilters = () => {
    let filtered = [...proformas];

    // Filtre par terme de recherche - LOGIQUE CORRIGÉE
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(proforma => {
        // Si le terme de recherche est un nombre, chercher SEULEMENT dans les numéros de proforma
        if (/^\d+$/.test(searchTerm.trim())) {
          const proformaNumber = String(proforma.nfact || proforma.nfprof || '').trim();
          const exactMatch = proformaNumber === searchTerm.trim();
          
          console.log(`🔍 Numeric search for "${searchTerm.trim()}":`, {
            proformaNumber,
            searchTerm: searchTerm.trim(),
            exactMatch
          });
          
          return exactMatch;
        } else {
          // Si ce n'est pas un nombre, chercher dans client et code client
          const clientMatch = proforma.client_name?.toLowerCase().includes(searchLower);
          const clientCodeMatch = proforma.nclient?.toLowerCase().includes(searchLower);
          
          console.log(`🔍 Text search for "${searchLower}":`, {
            clientName: proforma.client_name,
            clientCode: proforma.nclient,
            clientMatch,
            clientCodeMatch
          });
          
          return clientMatch || clientCodeMatch;
        }
      });
    }

    // Filtre par client spécifique
    if (selectedClient) {
      filtered = filtered.filter(proforma => 
        (proforma.client_name || proforma.nclient) === selectedClient
      );
    }

    // Filtre par date
    if (dateFrom) {
      filtered = filtered.filter(proforma => new Date(proforma.date_fact) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(proforma => new Date(proforma.date_fact) <= new Date(dateTo));
    }

    // Filtre par montant
    if (minAmount) {
      filtered = filtered.filter(proforma => parseFloat(proforma.montant_ttc || 0) >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter(proforma => parseFloat(proforma.montant_ttc || 0) <= parseFloat(maxAmount));
    }

    console.log(`🎯 Filtres appliqués:`, {
      original: proformas.length,
      filtered: filtered.length,
      searchTerm,
      isNumericSearch: /^\d+$/.test(searchTerm.trim()),
      selectedClient,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount
    });

    setFilteredProformas(filtered);
  };

  // Effet pour appliquer les filtres quand ils changent
  useEffect(() => {
    applyFilters();
  }, [searchTerm, dateFrom, dateTo, minAmount, maxAmount, selectedClient, proformas]);

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setSelectedClient('');
  };

  // Obtenir la liste unique des clients pour le filtre
  const uniqueClients = [...new Set(proformas.map(proforma => proforma.client_name || proforma.nclient))].filter(Boolean).sort();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' DA';
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Liste des Factures Proforma</h1>
        <div>
          <button onClick={() => router.push('/proforma')} className={styles.primaryButton}>
            Nouvelle Proforma
          </button>
          <button onClick={() => router.push('/dashboard')} className={styles.secondaryButton}>
            Retour
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Interface de filtrage */}
        <div style={{ marginBottom: '20px' }}>
          {/* Barre de recherche principale */}
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '15px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              placeholder="🔍 N° Proforma exact (ex: 1, 5) ou nom client (ex: Kaddour)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                minWidth: '300px',
                padding: '12px 16px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '12px 20px',
                background: showFilters ? '#007bff' : '#f8f9fa',
                color: showFilters ? 'white' : '#333',
                border: '2px solid #007bff',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              {showFilters ? '🔼 Masquer filtres' : '🔽 Plus de filtres'}
            </button>
            
            {(searchTerm || selectedClient || dateFrom || dateTo || minAmount || maxAmount) && (
              <button
                onClick={resetFilters}
                style={{
                  padding: '12px 20px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                🗑️ Effacer filtres
              </button>
            )}
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              marginBottom: '15px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px'
              }}>
                {/* Filtre par client */}
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                    👤 Client spécifique
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Tous les clients</option>
                    {uniqueClients.map(client => (
                      <option key={client} value={client}>{client}</option>
                    ))}
                  </select>
                </div>

                {/* Filtre par date */}
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                    📅 Date de début
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                    📅 Date de fin
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Filtre par montant */}
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                    💰 Montant min (DA)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                    💰 Montant max (DA)
                  </label>
                  <input
                    type="number"
                    placeholder="999999"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Résumé des filtres actifs */}
          {(searchTerm || selectedClient || dateFrom || dateTo || minAmount || maxAmount) && (
            <div style={{
              background: '#e7f3ff',
              padding: '10px 15px',
              borderRadius: '8px',
              border: '1px solid #b3d9ff',
              marginBottom: '15px'
            }}>
              <strong>🎯 Filtres actifs :</strong>
              {searchTerm && <span style={{ marginLeft: '10px', background: '#007bff', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Recherche: "{searchTerm}"</span>}
              {selectedClient && <span style={{ marginLeft: '10px', background: '#28a745', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Client: {selectedClient}</span>}
              {dateFrom && <span style={{ marginLeft: '10px', background: '#17a2b8', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Depuis: {dateFrom}</span>}
              {dateTo && <span style={{ marginLeft: '10px', background: '#17a2b8', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Jusqu\'à: {dateTo}</span>}
              {minAmount && <span style={{ marginLeft: '10px', background: '#ffc107', color: 'black', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Min: {minAmount} DA</span>}
              {maxAmount && <span style={{ marginLeft: '10px', background: '#ffc107', color: 'black', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Max: {maxAmount} DA</span>}
            </div>
          )}

          {/* Résumé des totaux */}
          {filteredProformas.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                    {filteredProformas.length}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Proformas</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                    {filteredProformas.reduce((sum, p) => sum + parseFloat(p.montant_ht?.toString() || '0'), 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Total HT</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                    {filteredProformas.reduce((sum, p) => sum + parseFloat(p.tva?.toString() || '0'), 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Total TVA</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                    {filteredProformas.reduce((sum, p) => sum + parseFloat(p.montant_ht?.toString() || '0') + parseFloat(p.tva?.toString() || '0'), 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Total TTC</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : proformas.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Aucune facture proforma</h2>
            <p>Vous n'avez pas encore créé de facture proforma.</p>
            <button 
              onClick={() => router.push('/proforma')} 
              className={styles.primaryButton}
            >
              Créer la première proforma
            </button>
          </div>
        ) : filteredProformas.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Aucun résultat</h2>
            <p>Aucune proforma ne correspond aux critères de recherche.</p>
            <button onClick={resetFilters} className={styles.primaryButton}>
              Effacer les filtres
            </button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° Proforma</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Montant HT</th>
                  <th style={{ textAlign: 'right' }}>TVA</th>
                  <th style={{ textAlign: 'right' }}>Total TTC</th>
                  <th>Actions</th>
                  <th>Impression</th>
                </tr>
              </thead>
              <tbody>
                {filteredProformas.map((proforma) => (
                  <tr key={proforma.nfact || proforma.nfprof}>
                    <td><strong>{proforma.nfact || proforma.nfprof}</strong></td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{proforma.client_name || proforma.nclient}</div>
                        {proforma.client_name && (
                          <div style={{ fontSize: '12px', color: '#666' }}>{proforma.nclient}</div>
                        )}
                      </div>
                    </td>
                    <td>{new Date(proforma.date_fact).toLocaleDateString('fr-FR')}</td>
                    <td style={{ textAlign: 'right' }}>{parseFloat(proforma.montant_ht?.toString() || '0').toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA</td>
                    <td style={{ textAlign: 'right' }}>{parseFloat(proforma.tva?.toString() || '0').toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA</td>
                    <td style={{ textAlign: 'right' }}><strong>{(parseFloat(proforma.montant_ht?.toString() || '0') + parseFloat(proforma.tva?.toString() || '0')).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA</strong></td>
                    <td>
                      <button 
                        onClick={() => router.push(`/proforma/${proforma.nfact || proforma.nfprof}`)}
                        className={styles.viewButton}
                      >
                        Voir
                      </button>
                    </td>
                    <td>
                      <PrintOptions
                        documentType="proforma"
                        documentId={proforma.nfact || proforma.nfprof}
                        documentNumber={proforma.nfact || proforma.nfprof}
                        clientName={(proforma as any).client_name || (proforma as any).clientName || 'Client'}
                        isModal={false}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}