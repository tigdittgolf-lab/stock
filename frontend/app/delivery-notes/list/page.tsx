'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

interface DeliveryNote {
  nbl: number;
  nclient: string;
  date_fact: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  created_at: string;
}

export default function DeliveryNotesList() {
  const router = useRouter();
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchDeliveryNotes();
  }, []);

  const fetchDeliveryNotes = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch('http://localhost:3005/api/sales/delivery-notes', {
        headers: {
          'X-Tenant': tenant
        }
      });
      const data = await response.json();
      if (data.success) {
        setDeliveryNotes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching delivery notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blId: number) => {
    // Confirmation de suppression
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le bon de livraison N° ${blId} ?\n\n` +
      `Cette action va :\n` +
      `• Supprimer définitivement le BL\n` +
      `• Récupérer le stock des articles\n` +
      `• Diminuer le chiffre d'affaires du client\n\n` +
      `Cette action est irréversible.`
    );

    if (!confirmed) return;

    setDeleting(blId);

    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch(`http://localhost:3005/api/sales/delivery-notes/${blId}`, {
        method: 'DELETE',
        headers: {
          'X-Tenant': tenant
        }
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Bon de livraison N° ${blId} supprimé avec succès !\n\n` +
              `• Stock récupéré automatiquement\n` +
              `• Chiffre d'affaires client mis à jour`);
        
        // Recharger la liste
        await fetchDeliveryNotes();
      } else {
        alert(`❌ Erreur lors de la suppression :\n${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting delivery note:', error);
      alert('❌ Erreur de connexion lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Liste des Bons de Livraison</h1>
        <div>
          <button onClick={() => router.push('/delivery-notes')} className={styles.primaryButton}>
            Nouveau BL
          </button>
          <button onClick={() => router.push('/dashboard')} className={styles.secondaryButton}>
            Retour
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {loading ? (
          <p>Chargement...</p>
        ) : deliveryNotes.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Aucun bon de livraison</h2>
            <p>Vous n'avez pas encore créé de bon de livraison.</p>
            <button 
              onClick={() => router.push('/delivery-notes')} 
              className={styles.primaryButton}
            >
              Créer le premier BL
            </button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° BL</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Montant HT</th>
                  <th>TVA</th>
                  <th>Total TTC</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveryNotes.map((bl) => (
                  <tr key={bl.nbl}>
                    <td><strong>{bl.nbl}</strong></td>
                    <td>{bl.nclient}</td>
                    <td>{new Date(bl.date_fact).toLocaleDateString('fr-FR')}</td>
                    <td>{bl.montant_ht?.toFixed(2)} DA</td>
                    <td>{bl.tva?.toFixed(2)} DA</td>
                    <td><strong>{bl.montant_ttc?.toFixed(2)} DA</strong></td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button 
                          onClick={() => router.push(`/delivery-notes/${bl.nbl}`)}
                          className={styles.viewButton}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          👁️ Voir
                        </button>
                        <button 
                          onClick={() => handleDelete(bl.nbl)}
                          disabled={deleting === bl.nbl}
                          className={styles.deleteButton}
                          style={{ 
                            fontSize: '12px', 
                            padding: '4px 8px',
                            backgroundColor: deleting === bl.nbl ? '#ccc' : '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: deleting === bl.nbl ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {deleting === bl.nbl ? '⏳' : '🗑️'} Supprimer
                        </button>
                      </div>
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