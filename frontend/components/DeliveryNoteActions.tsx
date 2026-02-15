'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrintOptions from './PrintOptions';

interface DeliveryNoteActionsProps {
  validId: number;
  displayId: number;
  clientName: string;
  clientId: string;
  onOpenPDF: (id: number, type: 'complete' | 'small' | 'ticket') => void;
}

export default function DeliveryNoteActions({
  validId,
  displayId,
  clientName,
  clientId,
  onOpenPDF
}: DeliveryNoteActionsProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Bouton Voir - Action principale */}
      <button
        onClick={() => {
          console.log(`🔗 Navigating to details with REAL ID: ${validId} for BL ${displayId}`);
          router.push(`/delivery-notes/${validId}`);
        }}
        style={{
          padding: '8px 16px',
          backgroundColor: 'var(--primary-color)',
          color: 'var(--text-inverse)',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        title={`Voir les détails du BL ${displayId}`}
      >
        👁️ Voir
      </button>
      
      {/* Menu déroulant pour les autres actions */}
      <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--text-secondary)',
            color: 'var(--text-inverse)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            lineHeight: '1'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--text-secondary)'}
          title="Plus d'actions"
        >
          ⋮
        </button>
        
        {/* Menu déroulant */}
        {showMenu && (
          <div
            style={{
              position: 'absolute',
              right: '0',
              top: '100%',
              marginTop: '4px',
              backgroundColor: 'var(--card-background)',
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              minWidth: '200px',
              overflow: 'hidden'
            }}
          >
            {/* Modifier */}
            <button
              onClick={() => {
                console.log(`✏️ Navigating to edit with REAL ID: ${validId} for BL ${displayId}`);
                router.push(`/delivery-notes/${validId}/edit`);
                setShowMenu(false);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color-light)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              ✏️ Modifier
            </button>
            
            {/* Divider - PDF */}
            <div style={{
              padding: '8px 16px',
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--background-secondary)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              📄 IMPRIMER
            </div>
            
            {/* BL Complet */}
            <button
              onClick={() => {
                console.log(`📄 PDF Complet - Using REAL ID: ${validId} for BL ${displayId}`);
                onOpenPDF(validId, 'complete');
                setShowMenu(false);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color-light)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              📄 BL Complet
            </button>
            
            {/* BL Réduit */}
            <button
              onClick={() => {
                console.log(`📄 PDF Réduit - Using REAL ID: ${validId} for BL ${displayId}`);
                onOpenPDF(validId, 'small');
                setShowMenu(false);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color-light)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              📄 BL Réduit
            </button>
            
            {/* Ticket */}
            <button
              onClick={() => {
                console.log(`🎫 PDF Ticket - Using REAL ID: ${validId} for BL ${displayId}`);
                onOpenPDF(validId, 'ticket');
                setShowMenu(false);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color-light)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              🎫 Ticket
            </button>
            
            {/* Divider - Partage */}
            <div style={{
              padding: '8px 16px',
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--background-secondary)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              📱 PARTAGER
            </div>
            
            {/* WhatsApp */}
            <div
              style={{
                width: '100%',
                padding: '0'
              }}
            >
              <div style={{ padding: '4px 8px' }}>
                <PrintOptions
                  documentType="bl"
                  documentId={validId}
                  documentNumber={displayId}
                  clientName={clientName}
                  clientId={clientId}
                  isModal={false}
                  whatsappOnly={true}
                />
              </div>
            </div>
            
            {/* Divider - Danger */}
            <div style={{
              padding: '8px 16px',
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--error-color)',
              backgroundColor: 'var(--background-secondary)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              ⚠️ DANGER
            </div>
            
            {/* Supprimer */}
            <button
              onClick={() => {
                if (confirm(`Êtes-vous sûr de vouloir supprimer le BL ${displayId} ?`)) {
                  alert('Fonction de suppression à implémenter');
                }
                setShowMenu(false);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                color: 'var(--error-color)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--error-color-light)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              🗑️ Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
