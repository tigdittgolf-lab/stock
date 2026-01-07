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

export default function ProformaListSimple() {
  const router = useRouter();
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [filteredProformas, setFilteredProformas] = useState<Proforma[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour les filtres - TOUJOURS VISIBLES
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true); // FORCÉ À TRUE

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

  // Fonction de filtrage simple
  const applyFilters = () => {
    let filtered = [...proformas];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(proforma => {
        if (/^\d+$/.test(searchTerm.trim())) {
          const proformaNumber = String(proforma.nfact || proforma.nfprof || '').trim();
          return proformaNumber === searchTerm.trim();
        } else {
          const clientMatch = proforma.client_name?.toLowerCase().includes(searchLower);
          const clientCodeMatch = proforma.nclient?.toLowerCase().includes(searchLower);
          return clientMatch || clientCodeMatch;
        }
      });
    }

    setFilteredProformas(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, proformas]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Liste des Factures Proforma (Version Test)</h1>
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
        {/* FILTRES TOUJOURS VISIBLES */}
        <div style={{ 
          background: '#f0f8ff', 
          padding: '20px', 
          marginBottom: '20px', 
          borderRadius: '8px',
          border: '2px solid #007bff'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#007bff' }}>
            🔍 FILTRES DE RECHERCHE (Version Test)
          </h3>
          
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="🔍 Tapez un numéro de proforma (ex: 1) ou nom client (ex: SECTEUR)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '16px',
                border: '2px solid #007bff',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ 
            background: '#e7f3ff', 
            padding: '10px', 
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            <strong>📊 Résultats:</strong> {filteredProformas.length} proforma(s) trouvée(s) sur {proformas.length} au total
            {searchTerm && (
              <div style={{ marginTop: '5px' }}>
                <strong>🔍 Recherche active:</strong> "{searchTerm}"
                <button 
                  onClick={() => setSearchTerm('')}
                  style={{
                    marginLeft: '10px',
                    padding: '2px 8px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ✖ Effacer
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : proformas.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Aucune facture proforma</h2>
            <p>Vous n'avez pas encore créé de facture proforma.</p>
          </div>
        ) : filteredProformas.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            background: '#fff3cd',
            borderRadius: '8px',
            border: '1px solid #ffeaa7'
          }}>
            <h2>🔍 Aucun résultat trouvé</h2>
            <p>Aucune proforma ne correspond à votre recherche "{searchTerm}"</p>
            <button 
              onClick={() => setSearchTerm('')}
              style={{
                padding: '10px 20px',
                background: '#ffc107',
                color: '#212529',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Effacer la recherche
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