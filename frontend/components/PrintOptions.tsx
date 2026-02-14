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
    console.log('═══════════════════════════════════════');
    console.log('🚀 DÉBUT handleSendWhatsApp');
    console.log('═══════════════════════════════════════');
    
    console.log('📊 État initial:', {
      selectedContacts,
      manualPhone,
      customMessage,
      documentType,
      documentId,
      documentNumber
    });
    
    if (selectedContacts.length === 0 && !manualPhone) {
      console.log('❌ ARRÊT: Aucun contact sélectionné');
      alert('Veuillez sélectionner au moins un contact ou saisir un numéro');
      return;
    }

    console.log('✅ Validation OK - Contacts présents');
    setIsSending(true);
    
    try {
      // Générer l'URL du PDF
      let pdfPath = '';
      switch (documentType) {
        case 'bl':
          pdfPath = `/api/pdf/delivery-note/${documentId}`;
          break;
        case 'invoice':
          pdfPath = `/api/pdf/invoice/${documentId}`;
          break;
        case 'proforma':
          pdfPath = `/api/pdf/proforma/${documentId}`;
          break;
      }
      
      console.log('📥 Téléchargement du PDF depuis:', pdfPath);
      
      // Télécharger le PDF
      const pdfResponse = await fetch(pdfPath);
      if (!pdfResponse.ok) {
        throw new Error(`Impossible de télécharger le PDF (erreur ${pdfResponse.status})`);
      }
      
      const pdfBlob = await pdfResponse.blob();
      console.log('✅ PDF téléchargé:', pdfBlob.size, 'bytes');
      
      // Uploader via notre API
      console.log('☁️ Upload du PDF...');
      const uploadFormData = new FormData();
      const docLabel = getDocumentLabel().replace(/\s+/g, '_');
      uploadFormData.append('file', pdfBlob, `${docLabel}_${documentNumber}.pdf`);
      
      const uploadResponse = await fetch('/api/upload-temp-pdf', {
        method: 'POST',
        body: uploadFormData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Erreur lors de l\'upload du document');
      }
      
      const uploadData = await uploadResponse.json();
      console.log('📦 Upload data:', uploadData);
      
      if (!uploadData.success || !uploadData.url) {
        throw new Error(uploadData.error || 'URL non reçue');
      }
      
      const publicUrl = uploadData.url;
      console.log('✅ Lien public:', publicUrl);
      
      // Message de base
      const baseMessage = customMessage || `Voici votre ${getDocumentLabel().toLowerCase()} N° ${documentNumber}`;
      
      // Message complet avec le lien
      const fullMessage = `${baseMessage}

📄 Télécharger le document (lien valide 1h):
${publicUrl}

💡 Cliquez sur le lien pour télécharger le PDF`;
      
      console.log('📝 Message créé');
      
      // Préparer les numéros de téléphone
      const phones = [
        ...selectedContacts,
        ...(manualPhone ? [manualPhone] : [])
      ];
      
      console.log('📱 Opening WhatsApp for', phones.length, 'contact(s)');
      
      // Ouvrir WhatsApp pour chaque contact
      let successCount = 0;
      for (const phone of phones) {
        try {
          // Nettoyer le numéro
          let cleanPhone = phone.replace(/[^0-9+]/g, '');
          
          // Ajouter +213 si nécessaire
          if (!cleanPhone.startsWith('+')) {
            if (cleanPhone.startsWith('0')) {
              cleanPhone = '+213' + cleanPhone.substring(1);
            } else {
              cleanPhone = '+213' + cleanPhone;
            }
          }
          
          console.log('📞 Processing phone:', phone, '→', cleanPhone);
          
          // Encoder le message
          const encodedMessage = encodeURIComponent(fullMessage);
          
          // Créer le lien WhatsApp
          const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
          console.log('🔗 Opening WhatsApp...');
          
          // Ouvrir dans un nouvel onglet
          const newWindow = window.open(whatsappUrl, '_blank');
          
          if (newWindow) {
            console.log('✅ WhatsApp window opened for', cleanPhone);
            successCount++;
          } else {
            console.error('❌ Failed to open window - popup blocked?');
            alert('⚠️ Les popups sont bloqués !\n\nAutorisez les popups pour ce site et réessayez.');
          }
          
          // Délai entre chaque ouverture
          if (phones.length > 1 && successCount < phones.length) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        } catch (error) {
          console.error('❌ Error opening WhatsApp for', phone, error);
        }
      }
      
      console.log('📊 RÉSULTAT:', { total: phones.length, success: successCount });
      
      // Afficher le résultat
      if (successCount > 0) {
        alert(`✅ ${successCount} fenêtre(s) WhatsApp ouverte(s) !

📱 Cliquez sur "Envoyer" dans WhatsApp.
💡 Le destinataire recevra le lien pour télécharger le PDF.
⏰ Le lien expire dans 1 heure.`);
        
        setShowWhatsAppModal(false);
        setSelectedContacts([]);
        setManualPhone('');
      } else {
        alert('❌ Impossible d\'ouvrir WhatsApp.\n\nVérifiez que les popups ne sont pas bloqués.');
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      alert(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      console.log('🏁 FIN handleSendWhatsApp');
      console.log('═══════════════════════════════════════');
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
          onClick={() => {
            console.log('🔍 WhatsApp button clicked - Opening modal');
            setShowWhatsAppModal(true);
            loadWhatsAppContacts();
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
                {/* Info banner */}
                <div style={{
                  padding: '12px',
                  backgroundColor: '#e3f2fd',
                  border: '1px solid #2196f3',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: '#1565c0',
                  lineHeight: '1.6'
                }}>
                  <strong>📱 Comment ça marche:</strong>
                  <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                    <li>WhatsApp s'ouvrira avec un message contenant le <strong>lien vers le PDF</strong></li>
                    <li>Vérifiez le message et cliquez sur <strong>"Envoyer"</strong> dans WhatsApp</li>
                    <li>Le destinataire recevra le lien et pourra <strong>télécharger le document</strong></li>
                  </ol>
                  <div style={{ marginTop: '8px', padding: '6px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                    💡 <strong>Astuce:</strong> Le document reste accessible via le lien tant que vous êtes connecté.
                  </div>
                </div>

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
                    placeholder="Ex: +213674768390 ou +33612345678"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className={styles.phoneInput}
                  />
                  <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Format international avec indicatif pays (ex: +213 pour l'Algérie, +33 pour la France)
                  </small>
                </div>

                <div className={styles.messageSection}>
                  <h4>Message d'accompagnement:</h4>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className={styles.messageInput}
                    rows={3}
                    placeholder={`Voici votre ${getDocumentLabel().toLowerCase()} N° ${documentNumber}`}
                  />
                  <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    💡 Le lien de téléchargement du PDF sera automatiquement ajouté à votre message
                  </small>
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
    <>
      <div className={styles.inlinePrintOptions}>
        {printOptions()}
      </div>

      {/* WhatsApp Modal pour le mode inline */}
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
              {/* Info banner */}
              <div style={{
                padding: '12px',
                backgroundColor: '#e3f2fd',
                border: '1px solid #2196f3',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#1565c0',
                lineHeight: '1.6'
              }}>
                <strong>📱 Comment ça marche:</strong>
                <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li>WhatsApp s'ouvrira avec un message contenant le <strong>lien vers le PDF</strong></li>
                  <li>Vérifiez le message et cliquez sur <strong>"Envoyer"</strong> dans WhatsApp</li>
                  <li>Le destinataire recevra le lien et pourra <strong>télécharger le document</strong></li>
                </ol>
                <div style={{ marginTop: '8px', padding: '6px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                  💡 <strong>Astuce:</strong> Le document reste accessible via le lien pendant 1 heure.
                </div>
              </div>

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
                  placeholder="Ex: +213674768390 ou +33612345678"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className={styles.phoneInput}
                />
                <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Format international avec indicatif pays (ex: +213 pour l'Algérie, +33 pour la France)
                </small>
              </div>

              <div className={styles.messageSection}>
                <h4>Message d'accompagnement:</h4>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className={styles.messageInput}
                  rows={3}
                  placeholder={`Voici votre ${getDocumentLabel().toLowerCase()} N° ${documentNumber}`}
                />
                <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  💡 Le lien de téléchargement du PDF sera automatiquement ajouté à votre message
                </small>
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