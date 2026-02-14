import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 API: Upload temp PDF request received');
    
    // Récupérer le PDF depuis le body
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log('📄 File received:', file.name, file.size, 'bytes');
    
    // Convertir en blob pour l'upload
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    
    // Créer un nouveau FormData pour tmpfiles.org
    const uploadFormData = new FormData();
    uploadFormData.append('file', blob, file.name);
    
    console.log('☁️ Uploading to tmpfiles.org...');
    
    // Upload vers tmpfiles.org depuis le backend
    const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: uploadFormData
    });
    
    console.log('📡 Upload response:', uploadResponse.status, uploadResponse.statusText);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Upload failed:', errorText);
      return NextResponse.json(
        { success: false, error: `Upload failed: ${uploadResponse.statusText}` },
        { status: uploadResponse.status }
      );
    }
    
    const uploadData = await uploadResponse.json();
    console.log('📦 Upload data:', uploadData);
    
    if (!uploadData.data || !uploadData.data.url) {
      return NextResponse.json(
        { success: false, error: 'No URL in response' },
        { status: 500 }
      );
    }
    
    // Convertir l'URL pour téléchargement direct
    let publicUrl = uploadData.data.url;
    publicUrl = publicUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
    
    console.log('✅ Public URL:', publicUrl);
    
    return NextResponse.json({
      success: true,
      url: publicUrl,
      expiresIn: '1 hour'
    });
    
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
