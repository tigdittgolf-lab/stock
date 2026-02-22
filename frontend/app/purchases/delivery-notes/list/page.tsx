'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from '../../../page.module.css';

interface PurchaseBL {
  nbl_achat?: number;
  nfournisseur: string;
  numero_bl_fournisseur: string;
  supplier_name: string;
  date_bl: string;
  montant_ht: number;
  tva: number;
  total_ttc: number;
  created_at: string;
}

export default function PurchaseBLList() {
  const router = useRouter();
  const [bls, setBls] = useState<PurchaseBL[]>([]);
  const [filteredBls, setFilteredBls] = useState<PurchaseBL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof PurchaseBL>('date_bl');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchBLs();
  }, []);

  useEffect(() => {
    filterAndSortBls();
  }, [bls, searchTerm, sortField, sortDirection]);

  const fetchBLs = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch(getApiUrl('purchases/delivery-notes'), {
        headers: {
          'X-Tenant': tenant
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setBls(data.data);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Error fetching purchase BLs:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBls = () => {
    let filtered = [...bls];

    if (searchTerm) {
      filtered = filtered.filter(bl =>
        bl.numero_bl_fournisseur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bl.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bl.nfournisseur?.toLowerCase().includes(searchTerm.toLowerCase())
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

    setFilteredBls(filtered);
    setCurrentPage(1);
  };

  const handleSort = (field: keyof PurchaseBL) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const totalPages = Math.ceil(filteredBls.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBls = filteredBls.slice(startIndex, endIndex);

  const formatNumber = (num: number) => {
    return num?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0.00';
  };

  const SortIcon = ({ field }: { field: keyof PurchaseBL }) => {
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
    <div className={styles.page} style={{ paddingTop: '20px' }}>
      <header className={styles.header}>
        <h1>📦 Liste des BL d'Achat</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/purchases/delivery-notes')} className={styles.primaryButton}>
            + Nouveau BL
          </button>
          <button onClick={() => router.push('/purchases')} className={styles.secondaryButton}>
            Factures d'Achat
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
            placeholder="🔍 Rechercher par N° BL ou fournisseur..."
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
            <button onClick={fetchBLs} className={styles.primaryButton}>
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
                    <th onClick={() => handleSort('numero_bl_fournisseur')} style={{ cursor: 'pointer' }}>
                      N° BL Fournisseur <SortIcon field="numero_bl_fournisseur" />
                    </th>
                    <th onClick={() => handleSort('supplier_name')} style={{ cursor: 'pointer' }}>
                      Fournisseur <SortIcon field="supplier_name" />
                    </th>
                    <th onClick={() => handleSort('date_bl')} style={{ cursor: 'pointer' }}>
                      Date <SortIcon field="date_bl" />
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
                  {currentBls.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                        <div>
                          <h3>😔 {searchTerm ? 'Aucun résultat' : 'Aucun BL d\'achat'}</h3>
                          <p>{searchTerm ? 'Essayez avec d\'autres termes de recherche.' : 'Commencez par créer votre premier BL d\'achat.'}</p>
                          {!searchTerm && (
                            <button 
                              onClick={() => router.push('/purchases/delivery-notes')} 
                              className={styles.primaryButton}
                              style={{ marginTop: '1rem' }}
                            >
                              + Créer un BL d'Achat
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentBls.map((bl) => (
                      <tr key={`${bl.numero_bl_fournisseur}-${bl.nfournisseur}`}>
                        <td><strong>{bl.numero_bl_fournisseur}</strong></td>
                        <td>{bl.supplier_name || bl.nfournisseur}</td>
                        <td>{new Date(bl.date_bl).toLocaleDateString('fr-FR')}</td>
                        <td style={{ textAlign: 'right' }}>
                          {formatNumber(bl.montant_ht)} DA
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {formatNumber(bl.tva)} DA
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong style={{ color: 'var(--success-text)' }}>{formatNumber(bl.total_ttc)} DA</strong>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button 
                              onClick={() => router.push(`/purchases/delivery-notes/${encodeURIComponent(bl.numero_bl_fournisseur)}/${encodeURIComponent(bl.nfournisseur)}`)}
                              className={styles.primaryButton}
                              style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                            >
                              👁️ Voir
                            </button>
                            <button 
                              onClick={() => router.push(`/purchases/delivery-notes/${encodeURIComponent(bl.numero_bl_fournisseur)}/${encodeURIComponent(bl.nfournisseur)}/edit`)}
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
            {filteredBls.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: 'var(--background-secondary)',
                borderRadius: '8px',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Affichage de {startIndex + 1} à {Math.min(endIndex, filteredBls.length)} sur {filteredBls.length} BL{filteredBls.length > 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                  <span style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--card-background)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
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

        {filteredBls.length > 0 && (
          <div className={styles.summary} style={{ marginTop: '1.5rem' }}>
            <h3>📊 Résumé</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--info-bg)', borderRadius: '8px', border: '1px solid var(--info-border)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total BLs</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--info-text)' }}>{filteredBls.length}</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'var(--success-bg)', borderRadius: '8px', border: '1px solid var(--success-border)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total HT</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-text)' }}>
                  {formatNumber(filteredBls.reduce((sum, bl) => sum + (bl.montant_ht || 0), 0))} DA
                </div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'var(--warning-bg)', borderRadius: '8px', border: '1px solid var(--warning-border)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total TVA</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning-text)' }}>
                  {formatNumber(filteredBls.reduce((sum, bl) => sum + (bl.tva || 0), 0))} DA
                </div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'var(--info-bg)', borderRadius: '8px', border: '1px solid var(--info-border)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total TTC</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--info-text)' }}>
                  {formatNumber(filteredBls.reduce((sum, bl) => sum + (bl.total_ttc || 0), 0))} DA
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}