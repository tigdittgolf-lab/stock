import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Attendre la résolution de la Promise params
    const { id } = await params;
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    
    console.log(`🔄 Frontend API: Forwarding invoice request for ID ${id}, tenant ${tenant}`);
    
    // Validation stricte de l'ID
    const numericId = parseInt(id);
    if (!id || id === 'undefined' || id === 'null' || isNaN(numericId) || numericId <= 0) {
      console.error(`🚨 ERREUR: ID facture invalide reçu par le proxy: "${id}"`);
      return NextResponse.json(
        { success: false, error: `ID facture invalide: ${id}. Veuillez fournir un ID valide.` },
        { status: 400 }
      );
    }
    
    const validId = String(numericId);
    
    // Utiliser Tailscale tunnel pour accéder au backend local
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://desktop-bhhs068.tail1d9c54.ts.net/api'
      : 'http://localhost:3005/api';
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error:  Backend error: ${response.status} - ${errorText}`);
      
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status} - ${errorText}`
      }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ Frontend API: Successfully forwarded invoice data for ID ${id}`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to fetch invoice: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}