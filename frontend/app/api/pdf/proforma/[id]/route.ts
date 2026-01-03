import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    
    console.log(`🔄 Frontend PDF API: Forwarding proforma PDF request for ID ${id}, tenant ${tenant}`);
    
    // Utiliser Tailscale tunnel pour accéder au backend local
    const backendUrl = 'https://desktop-bhhs068.tail1d9c54.ts.net/api/pdf/proforma/' + id;
    
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
          'Content-Disposition': `attachment; filename="proforma_${id}.pdf"`
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