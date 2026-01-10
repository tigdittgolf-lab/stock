import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    
    console.log(`🔄 Frontend API: Forwarding articles request for tenant ${tenant}`);
    
    // Utiliser Tailscale tunnel pour accéder au backend local
    const backendUrl = 'https://frontend-iota-six-72.vercel.app/api/articles';
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Backend articles error: ${response.status} - ${errorText}`);
      
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status} - ${errorText}`
      }, { status: response.status });
    }

    const data = await response.json();
    
    console.log(`✅ Frontend API: Successfully forwarded articles for tenant ${tenant}, found ${data.data?.length || 0} articles`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend articles API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to fetch articles: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const body = await request.json();
    
    console.log(`🔄 Frontend API: Forwarding create article request for tenant ${tenant}`);
    
    const backendUrl = 'https://frontend-iota-six-72.vercel.app/api/articles';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('❌ Frontend create article API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to create article: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}