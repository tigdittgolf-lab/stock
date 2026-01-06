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

  const openPDFPreview = (format: string) => {
    console.log(`🔍 PDF Preview - ID: ${documentId}, Type: ${format}, Document: ${documentType}`);
    
    if (!documentId || isNaN(documentId) || documentId <= 0) {
      console.error(`🚨 Invalid Document ID: ${documentId}`);
      alert(`Erreur: ID Document invalide: ${documentId}`);
      return;
    }

    let pdfUrl = '';
    
    switch (documentType) {
      case 'bl':
        const blUrls = {
          complet: `/api/pdf/delivery-note/${documentId}`,
          reduit: `/api/pdf/delivery-note-small/${documentId}`,
          ticket: `/api/pdf/delivery-note-ticket/${documentId}`
        };
        pdfUrl = blUrls[format as keyof typeof blUrls];
        break;
      case 'invoice':
        pdfUrl = `/api/pdf/invoice/${documentId}`;
        break;
      case 'proforma':
        pdfUrl = `/api/pdf/proforma/${documentId}`;
        break;
    }

    if (pdfUrl) {
      console.log(`📄 Opening PDF URL: ${pdfUrl}`);
      // Solution SIMPLE: Ouvrir directement l'URL dans un nouvel onglet
      window.open(pdfUrl, '_blank');
    }
  };

  const handlePrint = (format: string) => {
    openPDFPreview(format);
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