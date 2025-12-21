'use client';

import React from 'react';
import { useTenant } from '../hooks/useTenant';
import styles from './PrintOptions.module.css';

interface PrintOptionsProps {
  documentType: 'bl' | 'invoice' | 'proforma';
  documentId: number;
  documentNumber: number;
  clientName?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export default function PrintOptions({ 
  documentType, 
  documentId, 
  documentNumber, 
  clientName,
  onClose,
  isModal = false 
}: PrintOptionsProps) {
  
  const tenant = useTenant();
  
  const getDocumentLabel = () => {
    switch (documentType) {
      case 'bl': return 'Bon de Livraison';
      case 'invoice': return 'Facture';
      case 'proforma': return 'Proforma';
      default: return 'Document';
    }
  };

  const getEndpointBase = () => {
    switch (documentType) {
      case 'bl': return 'delivery-note';
      case 'invoice': return 'invoice';
      case 'proforma': return 'proforma';
      default: return '';
    }
  };

  const handlePrint = async (format: string) => {
    const baseUrl = 'http://localhost:3005/api/pdf';
    let url = '';
    
    switch (documentType) {
      case 'bl':
        switch (format) {
          case 'complet':
            url = `${baseUrl}/delivery-note/${documentId}`;
            break;
          case 'reduit':
            url = `${baseUrl}/delivery-note-small/${documentId}`;
            break;
          case 'ticket':
            url = `${baseUrl}/delivery-note-ticket/${documentId}`;
            break;
        }
        break;
      case 'invoice':
        url = `${baseUrl}/invoice/${documentId}`;
        break;
      case 'proforma':
        url = `${baseUrl}/proforma/${documentId}`;
        break;
    }

    if (url) {
      try {
        // Faire la requête avec les headers appropriés
        const response = await fetch(url, {
          headers: {
            'X-Tenant': tenant
          }
        });

        if (response.ok) {
          // Créer un blob à partir de la réponse
          const blob = await response.blob();
          const pdfUrl = URL.createObjectURL(blob);
          
          // Ouvrir le PDF dans un nouvel onglet
          const printWindow = window.open(pdfUrl, '_blank');
          if (printWindow) {
            printWindow.focus();
            // Nettoyer l'URL après un délai
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
          } else {
            alert('❌ Popup bloqué ! Veuillez autoriser les popups pour ce site.');
          }
        } else {
          const errorData = await response.json();
          console.error('❌ PDF Error:', errorData);
          alert(`❌ Erreur lors de la génération du PDF: ${errorData.error || 'Erreur inconnue'}`);
        }
      } catch (error) {
        console.error('❌ Print Error:', error);
        alert('❌ Erreur lors de l\'impression. Vérifiez que le serveur backend est démarré.');
      }
    }
  };

  const printOptions = () => {
    switch (documentType) {
      case 'bl':
        return (
          <>
            <button 
              onClick={() => handlePrint('complet')}
              className={styles.printButton}
            >
              📄 BL Complet
            </button>
            <button 
              onClick={() => handlePrint('reduit')}
              className={styles.printButton}
            >
              📄 BL Réduit
            </button>
            <button 
              onClick={() => handlePrint('ticket')}
              className={styles.printButton}
            >
              🎫 Ticket
            </button>
          </>
        );
      case 'invoice':
        return (
          <button 
            onClick={() => handlePrint('invoice')}
            className={styles.printButton}
          >
            📄 Imprimer Facture
          </button>
        );
      case 'proforma':
        return (
          <button 
            onClick={() => handlePrint('proforma')}
            className={styles.printButton}
          >
            📄 Imprimer Proforma
          </button>
        );
      default:
        return null;
    }
  };

  if (isModal) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h3>✅ {getDocumentLabel()} N° {documentNumber} créé avec succès !</h3>
            {clientName && <p>👤 Client: {clientName}</p>}
          </div>
          
          <div className={styles.modalBody}>
            <h4>🖨️ Options d'impression :</h4>
            <div className={styles.printOptionsGrid}>
              {printOptions()}
            </div>
          </div>
          
          <div className={styles.modalFooter}>
            <button 
              onClick={onClose}
              className={styles.closeButton}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Version inline pour les listes
  return (
    <div className={styles.inlinePrintOptions}>
      {printOptions()}
    </div>
  );
}