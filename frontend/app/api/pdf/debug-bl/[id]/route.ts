import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Attendre la résolution de la Promise params
    const { id } = await params;
    const tenant = request.headers.get('X-Tenant') || '2009_bu02';
    
    console.log(`🔍 Frontend Debug Proxy - BL ID: "${id}", Tenant: ${tenant}`);
    console.log(`🔍 Proxy Debug - ID Type: ${typeof id}, Length: ${id?.length}`);

    // Validation stricte de l'ID - PAS DE FALLBACK
    const numericId = parseInt(id);
    console.log(`🔍 Proxy Debug - Parsed ID: ${numericId}, isNaN: ${isNaN(numericId)}`);
    
    if (!id || id === 'undefined' || id === 'null' || isNaN(numericId) || numericId <= 0) {
      console.error(`🚨 ERREUR: ID debug invalide reçu par le proxy: "${id}"`);
      return NextResponse.json(
        { success: false, error: `ID BL invalide: ${id}. Veuillez fournir un ID valide.` },
        { status: 400 }
      );
    }
    
    const validId = String(numericId); // Normaliser l'ID

    // Faire la requête vers le backend local avec l'ID valide
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://desktop-bhhs068.tail1d9c54.ts.net/api'
      : 'http://localhost:3005/api';
    
    const response = await fetch(`${backendUrl}/pdf/debug-bl/${validId}`, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Backend error:  Backend debug error: ${response.status} - ${await response.text()}`);
      return NextResponse.json(
        { success: false, error: `Backend debug error: ${response.status}` },
        { status: response.status }
      );
    }

    // Récupérer les données de debug
    const debugData = await response.json();
    
    console.log(`✅ Debug data retrieved for BL ${validId}`);

    return NextResponse.json(debugData);

  } catch (error) {
    console.error('❌ Error in debug proxy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get debug data' },
      { status: 500 }
    );
  }
}