// API Route: /api/database/status
// Returns the current database type from the backend

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get the actual database type from the backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3005';
    
    try {
      const response = await fetch(`${backendUrl}/api/database/current`, {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Backend returns { success: true, currentType: 'mysql' | 'postgresql' | 'supabase' }
        if (data.success && data.currentType) {
          return NextResponse.json({
            success: true,
            currentType: data.currentType,
            config: {
              connected: true
            },
            message: `${data.currentType} actif`
          });
        }
      }
    } catch (backendError) {
      console.warn('Could not fetch database type from backend, using default');
    }
    
    // Fallback: Return supabase as default
    return NextResponse.json({
      success: true,
      currentType: 'supabase',
      config: {
        url: process.env.SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co',
        connected: true
      },
      message: 'Supabase actif (fallback)'
    });
  } catch (error: any) {
    console.error('Error in GET /api/database/status:', error);
    return NextResponse.json({
      success: true,
      currentType: 'supabase',
      config: {
        connected: false
      },
      message: 'Erreur'
    });
  }
}
