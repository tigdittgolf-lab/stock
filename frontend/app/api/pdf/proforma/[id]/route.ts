import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://desktop-bhhs068.tail1d9c54.ts.net/api'
  : 'http://localhost:3005/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15: params est maintenant une Promise
    const resolvedParams = await params;
    const tenant = request.headers.get('X-Tenant');
    
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant header required' },
        { status: 400 }
      );
    }

    console.log(`📄 Generating PDF for proforma ${resolvedParams.id}, tenant: ${tenant}`);

    const response = await fetch(`${API_BASE_URL}/pdf/proforma/${resolvedParams.id}`, {
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Backend PDF error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { success: false, error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    // Si c'est un PDF, retourner le stream
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      const pdfBuffer = await response.arrayBuffer();
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="proforma_${resolvedParams.id}.pdf"`
        }
      });
    }

    // Sinon retourner la réponse JSON
    const data = await response.json();
    console.log(`✅ PDF generated successfully for proforma ${resolvedParams.id}`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}