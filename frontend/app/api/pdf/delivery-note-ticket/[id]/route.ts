import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    
    console.log(`🎫 Frontend PDF Proxy - Ticket ID: ${id}, Tenant: ${tenant}`);

    // Validation de l'ID
    let validId = id;
    if (!id || id === 'undefined' || id === 'null') {
      console.warn(`⚠️ Invalid PDF ID received: ${id}, using fallback ID 5`);
      validId = '5';
    }

    // Faire la requête vers le backend local via le proxy frontend
    const backendUrl = `https://desktop-bhhs068.tail1d9c54.ts.net/api/pdf/delivery-note-ticket/${validId}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Backend PDF error: ${response.status} - ${await response.text()}`);
      return NextResponse.json(
        { success: false, error: `Backend PDF error: ${response.status} - ${await response.text()}` },
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