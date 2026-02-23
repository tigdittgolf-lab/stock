import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Attendre la résolution de la Promise params
    const { id } = await params;
    const tenant = request.headers.get('X-Tenant') || '2009_bu02';
    
    console.log(`🎫 Frontend PDF Proxy - Ticket ID: ${id}, Tenant: ${tenant}`);

    // Validation stricte de l'ID - PAS DE FALLBACK
    const numericId = parseInt(id);
    if (!id || id === 'undefined' || id === 'null' || isNaN(numericId) || numericId <= 0) {
      console.error(`🚨 ERREUR: ID ticket invalide reçu par le proxy: ${id}`);
      return NextResponse.json(
        { success: false, error: `ID BL invalide: ${id}. Veuillez fournir un ID valide.` },
        { status: 400 }
      );
    }
    
    const validId = String(numericId); // Normaliser l'ID

    // Faire la requête vers le backend via BACKEND_URL
    const backendUrl = process.env.BACKEND_URL 
      ? `${process.env.BACKEND_URL}/api`
      : 'http://localhost:3005/api';
    
    const response = await fetch(`${backendUrl}/pdf/delivery-note-ticket/${validId}`, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error:  Backend PDF error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { success: false, error: `Backend PDF error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    // Récupérer le PDF comme buffer
    const pdfBuffer = await response.arrayBuffer();
    
    console.log(`✅ PDF ticket généré avec succès pour BL ${id}, taille: ${pdfBuffer.byteLength} bytes`);

    // Retourner le PDF avec les bons headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="ticket_${validId}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Error in PDF ticket proxy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate ticket PDF' },
      { status: 500 }
    );
  }
}