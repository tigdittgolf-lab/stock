'use client';

import React, { useState } from 'react';
import { useTenant } from '../hooks/useTenant';
import styles from './PrintOptions.module.css';

interface PrintOptionsProps {
  documentType: 'bl' | 'invoice' | 'proforma';
  documentId: number;
  documentNumber: number;
  clientName?: string;
  clientId?: string;
  onClose?: () => void;
  isModal?: boolean;
  whatsappOnly?: boolean; // Nouvelle prop pour n'afficher que WhatsApp
}

interface WhatsAppContact {
  phoneNumber: string;
  name?: string;
  clientId?: string;
}

export default function PrintOptions({ 
  documentType, 
  documentId, 
  documentNumber, 
  clientName,
  clientId,
  onClose,
  isModal = false,
  whatsappOnly = false // Nouvelle prop avec valeur par défaut
}: PrintOptionsProps) {
  
  console.log('🔍 PrintOptions component loaded:', { documentType, documentId, documentNumber, isModal });
  
  const tenant = useTenant();
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappContacts, setWhatsappContacts] = useState<WhatsAppContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
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

  const handleWhatsAppClick = async () => {
    console.log('🔍 WhatsApp button clicked!');
    console.log('📊 Component state:', { 
      documentType, 
      documentId, 
      documentNumber, 
      clientName, 
      clientId,
      tenant: tenant?.id 
    });
    
    if (!tenant?.id) {
      console.error('❌ No tenant ID found!', tenant);
      alert('Erreur: Tenant non trouvé. Veuillez vous reconnecter.');
      return;
    }
    
    setShowWhatsAppModal(true);
    await loadWhatsAppContacts();
  };

  const loadWhatsAppContacts = async () => {
    console.log('🔄 Loading WhatsApp contacts...');
    console.log('📊 Tenant info:', tenant);
    
    if (!tenant?.id) {
      console.error('❌ No tenant ID for loading contacts');
      return;
    }
    
    setIsLoadingContacts(true);
    try {
      const url = `/api/whatsapp/contacts?tenantId=${tenant.id}&clientId=${clientId}`;
      console.log('🌐 Fetching:', url);
      
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Contacts data:', data);
        setWhatsappContacts(data.contacts || []);
        
        // Set default message
        const docLabel = getDocumentLabel();
        setCustomMessage(`Voici votre ${docLabel.toLowerCase()} N° ${documentNumber}`);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to load contacts:', errorData);
      }
    } catch (error) {
      console.error('❌ Error loading WhatsApp contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (selectedContacts.length === 0 && !manualPhone) {
      alert('Veuillez sélectionner au moins un contact ou saisir un numéro');
      return;
    }

    setIsSending(true);
    try {
      const recipients = [
        ...selectedContacts.map(phone => ({ phoneNumber: phone, clientId })),
        ...(manualPhone ? [{ phoneNumber: manualPhone, clientId }] : [])
      ];

      const response = await fetch('/api/whatsapp/send-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant?.id,
          documentId,
          documentType: documentType === 'bl' ? 'delivery_note' : documentType,
          filename: `${getDocumentLabel()}_${documentNumber}.pdf`,
          recipients,
          customMessage
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`WhatsApp envoyé avec succès ! ${result.summary.sent} envoyés, ${result.summary.failed} échecs`);
        setShowWhatsAppModal(false);
      } else {
        throw new Error('Erreur lors de l\'envoi WhatsApp');
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      alert('Erreur lors de l\'envoi WhatsApp');
    } finally {
      setIsSending(false);
    }
  };

  const handleContactToggle = (phoneNumber: string) => {
    setSelectedContacts(prev => 
      prev.includes(phoneNumber) 
        ? prev.filter(p => p !== phoneNumber)
        : [...prev, phoneNumber]
    );
  };

  const printOptions = () => {
    console.log('🔍 PrintOptions rendering - documentType:', documentType, 'whatsappOnly:', whatsappOnly);
    
    // Si whatsappOnly est true, ne retourner que le bouton WhatsApp
    if (whatsappOnly) {
      return (
        <button 
          onClick={async () => {
            console.log('🔍 Simple WhatsApp button clicked!');
            
            // Solution alternative : Ouvrir WhatsApp directement
            try {
              const phoneNumber = prompt('Entrez le numéro WhatsApp (ex: +213674768390):');
              if (!phoneNumber) return;
              
              const message = prompt('Message personnalisé (optionnel):') || 
                `Voici votre ${getDocumentLabel().toLowerCase()} N° ${documentNumber}`;
              
              // Créer le lien WhatsApp direct
              const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
              const encodedMessage = encodeURIComponent(message);
              const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
              
              // Ouvrir WhatsApp
              window.open(whatsappUrl, '_blank');
              
              alert('✅ WhatsApp ouvert ! Envoyez le message manuellement.');
            } catch (error) {
              console.error('❌ WhatsApp error:', error);
              alert('❌ Erreur lors de l\'ouverture WhatsApp');
            }
          }}
          className={`${styles.printButton} ${styles.whatsappButton}`}
          style={{ backgroundColor: '#25d366' }}
        >
          📱 Envoyer via WhatsApp
        </button>
      );
    }
    
    const baseOptions = (() => {
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
    })();

    console.log('🔍 Base options rendered, adding WhatsApp button');

    return (
      <>
        {baseOptions}
        <button 
          onClick={handleWhatsAppClick}
          className={`${styles.printButton} ${styles.whatsappButton}`}
          style={{ backgroundColor: '#25d366' }}
        >
          📱 Envoyer via WhatsApp
        </button>
      </>
    );
  };

  if (isModal) {
    return (
      <>
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

        {/* WhatsApp Modal */}
        {showWhatsAppModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.whatsappModal}>
              <div className={styles.modalHeader}>
                <h3>📱 Envoyer via WhatsApp</h3>
                <button 
                  onClick={() => setShowWhatsAppModal(false)}
                  className={styles.closeButton}
                >
                  ✕
                </button>
              </div>
              
              <div className={styles.modalBody}>
                <div className={styles.documentInfo}>
                  <p><strong>{getDocumentLabel()} N° {documentNumber}</strong></p>
                  {clientName && <p>Client: {clientName}</p>}
                </div>

                <div className={styles.contactsSection}>
                  <h4>Contacts WhatsApp:</h4>
                  {isLoadingContacts ? (
                    <p>Chargement des contacts...</p>
                  ) : whatsappContacts.length > 0 ? (
                    <div className={styles.contactsList}>
                      {whatsappContacts.map((contact, index) => (
                        <label key={index} className={styles.contactItem}>
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact.phoneNumber)}
                            onChange={() => handleContactToggle(contact.phoneNumber)}
                          />
                          <span>
                            {contact.name || 'Contact sans nom'} - {contact.phoneNumber}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p>Aucun contact WhatsApp trouvé</p>
                  )}
                </div>

                <div className={styles.manualPhoneSection}>
                  <h4>Ou saisir un numéro manuellement:</h4>
                  <input
                    type="text"
                    placeholder="Ex: +33612345678"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className={styles.phoneInput}
                  />
                </div>

                <div className={styles.messageSection}>
                  <h4>Message personnalisé:</h4>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className={styles.messageInput}
                    rows={3}
                  />
                </div>
              </div>
              
              <div className={styles.modalFooter}>
                <button 
                  onClick={() => setShowWhatsAppModal(false)}
                  className={styles.cancelButton}
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSendWhatsApp}
                  disabled={isSending || (selectedContacts.length === 0 && !manualPhone)}
                  className={styles.sendButton}
                >
                  {isSending ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Version inline pour les listes
  return (
    <div className={styles.inlinePrintOptions}>
      {printOptions()}
    </div>
  );
}