import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-url';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    const articleId = params.id;
    
    console.log(`🔄 Frontend API: Fetching article ${articleId} for tenant ${tenant}, DB: ${dbType}`);
    
    const backendUrl = getBackendUrl(`/api/articles/${articleId}`);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error: ${response.status} - ${errorText}`);
      
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status} - ${errorText}`
      }, { status: response.status });
    }

    const data = await response.json();
    
    console.log(`✅ Frontend API: Successfully fetched article ${articleId}`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend article API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to fetch article: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    const articleId = params.id;
    const body = await request.json();
    
    console.log(`🔄 Frontend API: Updating article ${articleId} for tenant ${tenant}, DB: ${dbType}`);
    
    const backendUrl = getBackendUrl(`/api/articles/${articleId}`);
    
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('❌ Frontend update article API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to update article: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    const articleId = params.id;
    
    console.log(`🔄 Frontend API: Deleting article ${articleId} for tenant ${tenant}, DB: ${dbType}`);
    
    const backendUrl = getBackendUrl(`/api/articles/${articleId}`);
    
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('❌ Frontend delete article API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to delete article: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
