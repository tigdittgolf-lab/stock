'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from '../../../page.module.css';

interface PurchaseInvoice {
  nfact_achat: number;
  nfournisseur: string;
  numero_facture_fournisseur: string;
  supplier_name: string;
  date_fact: string;
  montant_ht: number;
  tva: number;
  total_ttc: number;
  created_at: string;
}

export default function PurchaseInvoicesList() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof PurchaseInvoice>('date_fact');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    filterAndSortInvoices();
  }, [invoices, searchTerm, sortField, sortDirection]);

  const fetchInvoices = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch(getApiUrl('purchases/invoices'), {
        headers: {
          'X-Tenant': tenant
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setInvoices(data.data);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Error fetching purchase invoices:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortInvoices = () => {
    let filtered = [...invoices];

    if (searchTerm) {
      filtered = filtered.filter(inv =>
        inv.numero_facture_fournisseur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.nfournisseur?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredInvoices(filtered);
    setCurrentPage(1);
  };

  const handleSort = (field: keyof PurchaseInvoice) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = filteredInvoices.slice(startIndex, endIndex);

  const formatNumber = (num: number) => {
    return num?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0.00';
  };

  const SortIcon = ({ field }: { field: keyof PurchaseInvoice }) => {
    if (sortField !== field) return <span style={{ opacity: 0.3 }}>↕</span>;
    return <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>🧾 Liste des Factures d'Achat</h1>
        <div>
          <button onClick={() => router.push('/purchases')} className={styles.primaryButton}>
            + Nouvelle Facture
          </button>
          <button onClick={() => router.push('/dashboard')} className={styles.secondaryButton}>
            Retour
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Barre de recherche et filtres */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '1.5rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder="🔍 Rechercher par N° facture ou fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '300px',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          >
            <option value={10}>10 par page</option>
            <option value={25}>25 par page</option>
            <option value={50}>50 par page</option>
            <option value={100}>100 par page</option>
          </select>
        </div>
        {error && (
          <div className={styles.error}>
            <h2>❌ Erreur</h2>
            <p>{error}</p>
            <button onClick={fetchInvoices} className={styles.primaryButton}>
              Réessayer
            </button>
          </div>
        )}

        {!error && (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th onClick={() => handleSort('numero_facture_fournisseur')} style={{ cursor: 'pointer' }}>
                      N° Facture Fournisseur <SortIcon field="numero_facture_fournisseur" />
                    </th>
                    <th onClick={() => handleSort('supplier_name')} style={{ cursor: 'pointer' }}>
                      Fournisseur <SortIcon field="supplier_name" />
                    </th>
                    <th onClick={() => handleSort('date_fact')} style={{ cursor: 'pointer' }}>
                      Date <SortIcon field="date_fact" />
                    </th>
                    <th onClick={() => handleSort('montant_ht')} style={{ textAlign: 'right', cursor: 'pointer' }}>
                      Montant HT <SortIcon field="montant_ht" />
                    </th>
                    <th onClick={() => handleSort('tva')} style={{ textAlign: 'right', cursor: 'pointer' }}>
                      TVA <SortIcon field="tva" />
                    </th>
                    <th onClick={() => handleSort('total_ttc')} style={{ textAlign: 'right', cursor: 'pointer' }}>
                      Total TTC <SortIcon field="total_ttc" />
                    </th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                        <div>
                          <h3>😔 {searchTerm ? 'Aucun résultat' : 'Aucune facture d\'achat'}</h3>
                          <p>{searchTerm ? 'Essayez avec d\'autres termes de recherche.' : 'Commencez par créer votre première facture d\'achat.'}</p>
                          {!searchTerm && (
                            <button 
                              onClick={() => router.push('/purchases')} 
                              className={styles.primaryButton}
                              style={{ marginTop: '1rem' }}
                            >
                              + Créer une Facture d'Achat
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentInvoices.map((invoice) => (
                      <tr key={invoice.nfact_achat}>
                        <td><strong>{invoice.numero_facture_fournisseur || `ID-${invoice.nfact_achat}`}</strong></td>
                        <td>{invoice.supplier_name || invoice.nfournisseur}</td>
                        <td>{new Date(invoice.date_fact).toLocaleDateString('fr-FR')}</td>
                        <td style={{ textAlign: 'right' }}>
                          {formatNumber(invoice.montant_ht)} DA
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {formatNumber(invoice.tva)} DA
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong style={{ color: '#2e7d32' }}>{formatNumber(invoice.total_ttc)} DA</strong>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => router.push(`/purchases/invoices/${invoice.nfact_achat}`)}
                              className={styles.primaryButton}
                              style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                            >
                              👁️ Voir
                            </button>
                            <button 
                              onClick={() => router.push(`/purchases/invoices/${invoice.nfact_achat}/edit`)}
                              className={styles.secondaryButton}
                              style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                            >
                              ✏️ Modifier
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredInvoices.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Affichage de {startIndex + 1} à {Math.min(endIndex, filteredInvoices.length)} sur {filteredInvoices.length} facture{filteredInvoices.length > 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={styles.secondaryButton}
                    style={{ padding: '0.5rem 0.75rem' }}
                  >
                    ⏮️
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={styles.secondaryButton}
                    style={{ padding: '0.5rem 0.75rem' }}
                  >
                    ◀️
                  </button>
                  <span style={{ padding: '0.5rem 1rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={styles.secondaryButton}
                    style={{ padding: '0.5rem 0.75rem' }}
                  >
                    ▶️
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={styles.secondaryButton}
                    style={{ padding: '0.5rem 0.75rem' }}
                  >
                    ⏭️
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {filteredInvoices.length > 0 && (
          <div className={styles.summary} style={{ marginTop: '1.5rem' }}>
            <h3>📊 Résumé</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Total Factures</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2' }}>{filteredInvoices.length}</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Total HT</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2e7d32' }}>
                  {formatNumber(filteredInvoices.reduce((sum, inv) => sum + (inv.montant_ht || 0), 0))} DA
                </div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Total TVA</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f57c00' }}>
                  {formatNumber(filteredInvoices.reduce((sum, inv) => sum + (inv.tva || 0), 0))} DA
                </div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f3e5f5', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Total TTC</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7b1fa2' }}>
                  {formatNumber(filteredInvoices.reduce((sum, inv) => sum + (inv.total_ttc || 0), 0))} DA
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}