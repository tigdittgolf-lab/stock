import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Attendre la résolution de la Promise params
    const { id } = await params;
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    
    console.log(`🔄 Frontend PDF API: Forwarding proforma PDF request for ID ${id}, tenant ${tenant}`);
    
    // Validation stricte de l'ID
    const numericId = parseInt(id);
    if (!id || id === 'undefined' || id === 'null' || isNaN(numericId) || numericId <= 0) {
      console.error(`🚨 ERREUR: ID proforma invalide reçu par le proxy: "${id}"`);
      return NextResponse.json(
        { success: false, error: `ID proforma invalide: ${id}. Veuillez fournir un ID valide.` },
        { status: 400 }
      );
    }
    
    const validId = String(numericId);
    
    // Utiliser Tailscale tunnel pour accéder au backend local
    const backendUrl = 'https://desktop-bhhs068.tail1d9c54.ts.net/api/pdf/proforma/' + validId;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Backend PDF error: ${response.status} - ${errorText}`);
      
      return NextResponse.json({
        success: false,
        error: `Backend PDF error: ${response.status} - ${errorText}`
      }, { status: response.status });
    }

    // Vérifier si c'est un PDF ou une erreur JSON
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/pdf')) {
      // C'est un PDF, le transférer directement
      const pdfBuffer = await response.arrayBuffer();
      
      console.log(`✅ Frontend PDF API: Successfully forwarded PDF for proforma ${id}`);
      
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="proforma_${validId}.pdf"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } else {
      // C'est probablement une erreur JSON
      const errorData = await response.json();
      console.error(`❌ Backend returned error:`, errorData);
      
      return NextResponse.json(errorData, { status: response.status });
    }

  } catch (error) {
    console.error('❌ Frontend PDF API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}