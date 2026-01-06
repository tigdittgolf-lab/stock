import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Attendre la résolution de la Promise params
    const { id } = await params;
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    
    console.log(`📄 Frontend PDF Proxy - BL Complet ID: "${id}", Type: ${typeof id}, Tenant: ${tenant}`);
    console.log(`📄 Frontend PDF Proxy - ID length: ${id?.length}, ID value: ${JSON.stringify(id)}`);

    // Validation stricte de l'ID - PAS DE FALLBACK
    const numericId = parseInt(id);
    if (!id || id === 'undefined' || id === 'null' || isNaN(numericId) || numericId <= 0) {
      console.error(`🚨 ERREUR: ID BL invalide reçu par le proxy: "${id}"`);
      console.error(`🚨 ERREUR: ID details - Value: ${JSON.stringify(id)}, Type: ${typeof id}, Length: ${id?.length}`);
      return NextResponse.json(
        { success: false, error: `ID BL invalide: ${id}. Veuillez fournir un ID valide.` },
        { status: 400 }
      );
    }
    
    const validId = String(numericId); // Normaliser l'ID

    // Faire la requête vers le backend local via le proxy frontend
    const backendUrl = `https://desktop-bhhs068.tail1d9c54.ts.net/api/pdf/delivery-note/${validId}`;
    
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
    
    console.log(`✅ PDF généré avec succès pour BL ${id}, taille: ${pdfBuffer.byteLength} bytes`);

    // Retourner le PDF avec les bons headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="bl_${validId}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Error in PDF proxy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}