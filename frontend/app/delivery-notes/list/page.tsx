'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

interface DeliveryNote {
  nfact: number;
  date_fact: string;
  nclient: string;
  montant_ht: number;
  tva: number;
  timbre: number;
  autre_taxe: number;
  facturer: boolean;
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
      const response = await fetch('http://localhost:3005/api/sales/delivery-notes');
      const data = await response.json();
      if (data.success) {
        setDeliveryNotes(data.data);
      }
    } catch (error) {
      console.error('Error fetching delivery notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintBL = (blId: number) => {
    // Open PDF in new tab
    window.open(`http://localhost:3005/api/pdf/delivery-note/${blId}`, '_blank');
  };

  const handleConvertToInvoice = async (blId: number) => {
    if (!confirm('Voulez-vous convertir ce bon de livraison en facture?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3005/api/sales/convert-bl/${blId}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        alert('Bon de livraison converti en facture avec succès!');
        fetchDeliveryNotes(); // Refresh list
      } else {
        alert('Erreur: ' + data.error);
      }
    } catch (error) {
      console.error('Error converting BL:', error);
      alert('Erreur lors de la conversion');
    }
  };

  const calculateTotal = (bl: DeliveryNote) => {
    return bl.montant_ht + bl.tva + bl.timbre + bl.autre_taxe;
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.main}>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Liste des Bons de Livraison</h1>
        <div>
          <button onClick={() => router.push('/delivery-notes')} className={styles.primaryButton}>
            Nouveau BL
          </button>
          <button onClick={() => router.push('/')} className={styles.secondaryButton}>
            Retour
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>N° BL</th>
                <th>Date</th>
                <th>Client</th>
                <th>Montant HT</th>
                <th>TVA</th>
                <th>Total TTC</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveryNotes.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center' }}>
                    Aucun bon de livraison trouvé
                  </td>
                </tr>
              ) : (
                deliveryNotes.map((bl) => (
                  <tr key={bl.nfact}>
                    <td>{bl.nfact}</td>
                    <td>{new Date(bl.date_fact).toLocaleDateString('fr-FR')}</td>
                    <td>{bl.nclient}</td>
                    <td>{bl.montant_ht.toFixed(2)} DA</td>
                    <td>{bl.tva.toFixed(2)} DA</td>
                    <td><strong>{calculateTotal(bl).toFixed(2)} DA</strong></td>
                    <td>
                      {bl.facturer ? (
                        <span style={{ color: 'green' }}>✓ Facturé</span>
                      ) : (
                        <span style={{ color: 'orange' }}>En attente</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handlePrintBL(bl.nfact)}
                        className={styles.primaryButton}
                        style={{ marginRight: '5px', fontSize: '12px', padding: '5px 10px' }}
                      >
                        📄 Imprimer
                      </button>
                      {!bl.facturer && (
                        <button
                          onClick={() => handleConvertToInvoice(bl.nfact)}
                          className={styles.primaryButton}
                          style={{ fontSize: '12px', padding: '5px 10px', backgroundColor: '#28a745' }}
                        >
                          ➜ Facturer
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
