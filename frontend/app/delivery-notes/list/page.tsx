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
  total_ttc: number;
  created_at: string;
}

export default function DeliveryNotesList() {
  const router = useRouter();
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveryNotes();
  }, []);

  const fetchDeliveryNotes = async () => {
    try {
      const response = await fetch('http://localhost:3005/api/sales/delivery-notes', {
        headers: {
          'X-Tenant': '2025_bu01'
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
                    <td><strong>{bl.total_ttc?.toFixed(2)} DA</strong></td>
                    <td>
                      <button 
                        onClick={() => router.push(`/delivery-notes/${bl.nbl}`)}
                        className={styles.viewButton}
                      >
                        Voir
                      </button>
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