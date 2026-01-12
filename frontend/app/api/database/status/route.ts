import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://desktop-bhhs068.tail1d9c54.ts.net/api'
  : 'http://localhost:3005/api';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    
    // Appeler l'endpoint de statut de base de données du backend
    const response = await fetch(`${API_BASE_URL}/database/current`, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant
      }
    });
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      currentType: data.currentType,
      timestamp: data.timestamp
    });
  } catch (error) {
    console.error('Database status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get database status' },
      { status: 500 }
    );
  }
}