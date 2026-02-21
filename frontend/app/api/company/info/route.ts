import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3005';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    
    console.log(`🔍 Récupération infos entreprise pour le tenant: ${tenant}, DB: ${dbType}`);

    // Forwarder la requête vers le backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/company/info`, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend responded with status ${backendResponse.status}`);
    }

    const data = await backendResponse.json();
    
    console.log(`✅ Company info received from backend (${data.database_type || 'unknown'} database)`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Error forwarding to backend:', error);
    
    // Fallback data
    return NextResponse.json({
      success: true,
      data: {
        nom_entreprise: 'ETS BENAMAR BOUZID MENOUAR',
        adresse: '10, Rue Belhandouz A.E.K, Mostaganem',
        telephone: '(213)045.42.35.20',
        email: 'outillagesaada@gmail.com'
      }
    });
  }
}