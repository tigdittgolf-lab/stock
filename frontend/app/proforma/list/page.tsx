'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrintOptions from '../../../components/PrintOptions';
import styles from '../../page.module.css';

interface Proforma {
  nfprof: number;
  nclient: string;
  date_fact: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
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
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch(`http://localhost:3005/api/sales/proforma`, {
        headers: {
          'X-Tenant': tenant
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

  // Fonction de filtrage
  const applyFilters = () => {
    let filtered = [...proformas];

    // Filtre par terme de recherche (numéro proforma, client)
    if (searchTerm) {
      filtered = filtered.filter(proforma => 
        proforma.nclient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(proforma.nfprof || '').includes(searchTerm)
      );
    }

    // Filtre par client spécifique
    if (selectedClient) {
      filtered = filtered.filter(proforma => proforma.nclient === selectedClient);
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
      filtered = filtered.filter(proforma => proforma.montant_ttc >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter(proforma => proforma.montant_ttc <= parseFloat(maxAmount));
    }

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
  const uniqueClients = [...new Set(proformas.map(proforma => proforma.nclient))].filter(Boolean).sort();

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
                {proformas.map((proforma) => (
                  <tr key={proforma.nfprof}>
                    <td><strong>{proforma.nfprof}</strong></td>
                    <td>{proforma.nclient}</td>
                    <td>{new Date(proforma.date_fact).toLocaleDateString('fr-FR')}</td>
                    <td style={{ textAlign: 'right' }}>{proforma.montant_ht?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA</td>
                    <td style={{ textAlign: 'right' }}>{proforma.tva?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA</td>
                    <td style={{ textAlign: 'right' }}><strong>{proforma.montant_ttc?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA</strong></td>
                    <td>
                      <button 
                        onClick={() => router.push(`/proforma/${proforma.nfprof}`)}
                        className={styles.viewButton}
                      >
                        Voir
                      </button>
                    </td>
                    <td>
                      <PrintOptions
                        documentType="proforma"
                        documentId={proforma.nfprof}
                        documentNumber={proforma.nfprof}
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