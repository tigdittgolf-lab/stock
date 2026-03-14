'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../../page.module.css';

interface Document {
  id: number;
  number: string;
  date: string;
  client_supplier: string;
  total_ttc: number;
  total_paid: number;
  balance: number;
}

export default function AddPayment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Paramètres de l'URL
  const documentType = searchParams.get('type') || 'delivery_note'; // delivery_note, invoice, purchase_delivery_note, purchase_invoice
  const documentId = searchParams.get('id') || '';
  
  const [document, setDocument] = useState<Document | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (documentId) {
      fetchDocumentDetails();
    }
  }, [documentId, documentType]);

  const fetchDocumentDetails = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2009_bu02';
      
      // Récupérer les détails du document et ses paiements
      const response = await fetch(`/api/payments?documentType=${documentType}&documentId=${documentId}`, {
        headers: {
          'X-Tenant': tenant
        }
      });

      const data = await response.json();
      
      if (data.success) {
        const payments = data.data || [];
        const totalPaid = payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
        
        // TODO: Récupérer le montant total du document
        // Pour l'instant, on utilise des valeurs fictives
        setDocument({
          id: parseInt(documentId),
          number: documentId,
          date: new Date().toISOString().split('T')[0],
          client_supplier: 'Client/Fournisseur',
          total_ttc: 1000, // À récupérer depuis le document
          total_paid: totalPaid,
          balance: 1000 - totalPaid
        });
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      setError('Erreur lors du chargement du document');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentId) {
      setError('Document non spécifié');
      return;
    }

    if (paymentAmount <= 0) {
      setError('Le montant doit être supérieur à 0');
      return;
    }

    if (document && paymentAmount > document.balance) {
      setError(`Le montant ne peut pas dépasser la dette restante (${document.balance.toFixed(2)} DA)`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentType: documentType,
          documentId: parseInt(documentId),
          paymentDate: paymentDate,
          amount: paymentAmount,
          paymentMethod: paymentMethod,
          notes: paymentNotes || null
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Paiement de ${paymentAmount.toFixed(2)} DA enregistré avec succès!`);
        
        // Réinitialiser le formulaire
        setPaymentAmount(0);
        setPaymentNotes('');
        
        // Recharger les détails du document
        setTimeout(() => {
          fetchDocumentDetails();
          setSuccess('');
        }, 2000);
      } else {
        setError(data.error || 'Erreur lors de l\'enregistrement du paiement');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = () => {
    switch (documentType) {
      case 'delivery_note': return 'BL Client';
      case 'invoice': return 'Facture Client';
      case 'purchase_delivery_note': return 'BL Fournisseur';
      case 'purchase_invoice': return 'Facture Fournisseur';
      default: return 'Document';
    }
  };

  const isPurchase = documentType.startsWith('purchase');

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>💰 Ajouter un Paiement</h1>
          <button onClick={() => router.back()} className={styles.secondaryButton}>
            ← Retour
          </button>
        </div>

        {/* Informations du document */}
        {document && (
          <div className={styles.formSection} style={{ marginBottom: '2rem', background: '#f8f9fa' }}>
            <h2>📄 {getDocumentTypeLabel()} N° {document.number}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Date</div>
                <div style={{ fontWeight: 'bold' }}>{new Date(document.date).toLocaleDateString('fr-FR')}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Total TTC</div>
                <div style={{ fontWeight: 'bold' }}>{document.total_ttc.toFixed(2)} DA</div>
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Déjà payé</div>
                <div style={{ fontWeight: 'bold', color: '#28a745' }}>{document.total_paid.toFixed(2)} DA</div>
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Reste à payer</div>
                <div style={{ fontWeight: 'bold', color: document.balance > 0 ? '#dc3545' : '#28a745' }}>
                  {document.balance.toFixed(2)} DA
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire de paiement */}
        <form onSubmit={handleSubmit}>
          <div className={styles.formSection}>
            <h2>💳 Nouveau Paiement</h2>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Date du paiement:</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Montant (DA):</label>
                <input
                  type="number"
                  step="0.01"
                  lang="en"
                  min="0.01"
                  max={document?.balance || undefined}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  placeholder="0.00"
                  required
                />
                {document && document.balance > 0 && (
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Maximum: {document.balance.toFixed(2)} DA
                  </small>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Méthode de paiement:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                >
                  <option value="cash">Espèces</option>
                  <option value="check">Chèque</option>
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="credit_card">Carte bancaire</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label>Notes (optionnel):</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ex: Paiement partiel, règlement différé..."
                  rows={3}
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

            {document && paymentAmount > 0 && paymentAmount < document.balance && (
              <div style={{
                padding: '12px',
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                marginTop: '12px'
              }}>
                <strong>⚠️ Après ce paiement, il restera: {(document.balance - paymentAmount).toFixed(2)} DA</strong>
              </div>
            )}

            {document && paymentAmount > 0 && paymentAmount === document.balance && (
              <div style={{
                padding: '12px',
                background: '#d4edda',
                border: '1px solid #28a745',
                borderRadius: '8px',
                marginTop: '12px'
              }}>
                <strong>✅ Ce paiement soldera complètement la dette!</strong>
              </div>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className={styles.error}>
              <p>❌ {error}</p>
            </div>
          )}

          {success && (
            <div className={styles.success}>
              <p>✅ {success}</p>
            </div>
          )}

          {/* Actions */}
          <div className={styles.formActions}>
            <button 
              type="button" 
              onClick={() => router.back()} 
              className={styles.secondaryButton}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={loading || !document || document.balance <= 0}
              className={styles.primaryButton}
            >
              {loading ? 'Enregistrement...' : '💰 Enregistrer le Paiement'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
