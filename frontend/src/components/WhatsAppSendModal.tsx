/**
 * WhatsApp Send Modal - Interface for selecting contacts and sending documents
 * Requirements: 1.1, 2.1, 4.1, 4.2, 4.3, 4.4, 4.5
 */

import React, { useState, useEffect } from 'react';
import { X, Send, Search, User, Phone, CheckCircle, AlertCircle } from 'lucide-react';

interface WhatsAppContact {
  id?: string;
  phoneNumber: string;
  name?: string;
  clientId?: string;
  isVerified?: boolean;
}

interface DocumentMetadata {
  id: string;
  type: 'invoice' | 'delivery_note' | 'proforma';
  filename: string;
  size: number;
  clientId?: string;
}

interface WhatsAppSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentMetadata;
  onSend: (contacts: WhatsAppContact[], message: string) => Promise<void>;
}

interface SendResult {
  contact: WhatsAppContact;
  success: boolean;
  messageId?: string;
  error?: string;
  status: 'sent' | 'queued' | 'failed';
}

export const WhatsAppSendModal: React.FC<WhatsAppSendModalProps> = ({
  isOpen,
  onClose,
  document,
  onSend
}) => {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<WhatsAppContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState<SendResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Load contacts when modal opens
  useEffect(() => {
    if (isOpen) {
      loadContacts();
      setCustomMessage(`Voici votre ${getDocumentTypeLabel(document.type)}: ${document.filename}`);
    }
  }, [isOpen, document]);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'invoice': return 'facture';
      case 'delivery_note': return 'bon de livraison';
      case 'proforma': return 'proforma';
      default: return 'document';
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber.includes(searchQuery)
  );

  const handleContactToggle = (contact: WhatsAppContact) => {
    setSelectedContacts(prev => {
      const isSelected = prev.some(c => c.phoneNumber === contact.phoneNumber);
      if (isSelected) {
        return prev.filter(c => c.phoneNumber !== contact.phoneNumber);
      } else {
        return [...prev, contact];
      }
    });
  };

  const handleAddManualContact = () => {
    if (!manualPhone.trim()) return;

    const newContact: WhatsAppContact = {
      phoneNumber: manualPhone.trim(),
      name: manualName.trim() || undefined
    };

    setSelectedContacts(prev => [...prev, newContact]);
    setManualPhone('');
    setManualName('');
  };

  const handleSend = async () => {
    if (selectedContacts.length === 0) return;

    setIsSending(true);
    try {
      await onSend(selectedContacts, customMessage);
      
      // Mock results for demo (in real implementation, this would come from the API response)
      const mockResults: SendResult[] = selectedContacts.map(contact => ({
        contact,
        success: Math.random() > 0.2, // 80% success rate for demo
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: Math.random() > 0.2 ? 'sent' : 'failed',
        error: Math.random() > 0.2 ? undefined : 'Numéro WhatsApp non valide'
      }));

      setSendResults(mockResults);
      setShowResults(true);
    } catch (error) {
      console.error('Error sending WhatsApp messages:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setSelectedContacts([]);
    setSearchQuery('');
    setCustomMessage('');
    setManualPhone('');
    setManualName('');
    setSendResults([]);
    setShowResults(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Envoyer via WhatsApp
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {document.filename} ({(document.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!showResults ? (
            <>
              {/* Document Preview */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Aperçu du document</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 font-semibold text-xs">PDF</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{document.filename}</p>
                    <p className="text-sm text-gray-600">
                      {getDocumentTypeLabel(document.type)} • {(document.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Selection */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Sélectionner les destinataires</h3>
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Rechercher un contact..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Contact List */}
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {isLoading ? (
                    <div className="p-4 text-center text-gray-500">Chargement des contacts...</div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Aucun contact trouvé</div>
                  ) : (
                    filteredContacts.map((contact, index) => (
                      <div
                        key={index}
                        className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                          selectedContacts.some(c => c.phoneNumber === contact.phoneNumber)
                            ? 'bg-blue-50 border-blue-200'
                            : ''
                        }`}
                        onClick={() => handleContactToggle(contact)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <User size={20} className="text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {contact.name || 'Contact sans nom'}
                              </p>
                              <p className="text-sm text-gray-600 flex items-center">
                                <Phone size={14} className="mr-1" />
                                {contact.phoneNumber}
                                {contact.isVerified && (
                                  <CheckCircle size={14} className="ml-2 text-green-500" />
                                )}
                              </p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedContacts.some(c => c.phoneNumber === contact.phoneNumber)}
                            onChange={() => handleContactToggle(contact)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Manual Contact Entry */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Ajouter un numéro manuellement</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Numéro de téléphone"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Nom (optionnel)"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleAddManualContact}
                      disabled={!manualPhone.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Contacts */}
              {selectedContacts.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Destinataires sélectionnés ({selectedContacts.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedContacts.map((contact, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {contact.name || contact.phoneNumber}
                        <button
                          onClick={() => handleContactToggle(contact)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message personnalisé
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tapez votre message ici..."
                />
              </div>
            </>
          ) : (
            /* Send Results */
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Résultats de l'envoi</h3>
              <div className="space-y-3">
                {sendResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {result.success ? (
                          <CheckCircle className="text-green-500" size={20} />
                        ) : (
                          <AlertCircle className="text-red-500" size={20} />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {result.contact.name || result.contact.phoneNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            {result.contact.phoneNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          result.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.success ? 'Envoyé' : 'Échec'}
                        </p>
                        {result.error && (
                          <p className="text-xs text-red-500">{result.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {!showResults && selectedContacts.length > 0 && (
              `${selectedContacts.length} destinataire(s) sélectionné(s)`
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {showResults ? 'Fermer' : 'Annuler'}
            </button>
            {!showResults && (
              <button
                onClick={handleSend}
                disabled={selectedContacts.length === 0 || isSending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Envoyer via WhatsApp</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSendModal;