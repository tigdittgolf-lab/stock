'use client';

import React from 'react';

interface TestWhatsAppButtonProps {
  documentId: number;
  documentNumber: number;
  clientName?: string;
}

export default function TestWhatsAppButton({ 
  documentId, 
  documentNumber, 
  clientName 
}: TestWhatsAppButtonProps) {
  
  const handleWhatsAppClick = () => {
    alert(`Test WhatsApp - Document ID: ${documentId}, Number: ${documentNumber}, Client: ${clientName}`);
  };

  return (
    <button 
      onClick={handleWhatsAppClick}
      style={{
        backgroundColor: '#25d366',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '10px 16px',
        fontSize: '13px',
        cursor: 'pointer',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        minHeight: '40px',
        width: '100%'
      }}
    >
      📱 TEST WhatsApp
    </button>
  );
}