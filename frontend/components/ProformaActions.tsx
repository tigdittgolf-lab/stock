'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProformaActionsProps {
  proformaId: number;
  clientName: string;
}

export default function ProformaActions({
  proformaId,
  clientName
}: ProformaActionsProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculer la position et taille optimale du menu
  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      
      const margin = 20;
      const menuWidth = 220;
      
      let style: React.CSSProperties = {
        position: 'fixed',
        backgroundColor: 'var(--card-background)',
        border: '2px solid var(--border-color)',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        zIndex: 1000,
        width: `${menuWidth}px`,
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--primary-color) var(--background-secondary)'
      };
      
      const rightPosition = viewportWidth - buttonRect.right;
      style.right = `${rightPosition}px`;
      
      if (spaceBelow >= spaceAbove) {
        style.top = `${buttonRect.bottom + 4}px`;
        style.maxHeight = `${spaceBelow - margin}px`;
      } else {
        style.bottom = `${viewportHeight - buttonRect.top + 4}px`;
        style.maxHeight = `${spaceAbove - margin}px`;
      }
      
      setMenuStyle(style);
    }
  }, [showMenu]);

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
      <button
        onClick={() => {
          if (!proformaId || proformaId === undefined) {
            console.error('❌ ID proforma invalide:', proformaId);
            alert(`Erreur: ID du proforma non trouvé`);
            return;
          }
          router.push(`/proforma/${proformaId}`);
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
        title={`Voir les détails du proforma ${proformaId}`}
      >
        👁️ Voir
      </button>
      
      <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          ref={buttonRef}
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
        
        {showMenu && (
          <div style={menuStyle}>
            <button
              onClick={() => {
                router.push(`/proforma/${proformaId}/edit`);
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
            
            <button
              onClick={() => {
                if (confirm(`Êtes-vous sûr de vouloir supprimer le proforma ${proformaId} ?`)) {
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
