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
    
    // Upload vers tmpfiles.org avec timeout de 15 secondes (plus rapide pour fallback)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes
    
    try {
      const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: uploadFormData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('📡 Upload response:', uploadResponse.status, uploadResponse.statusText);
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ tmpfiles.org failed:', errorText);
        
        // Fallback vers file.io
        console.log('🔄 Trying fallback service: file.io...');
        return await uploadToFileIo(blob, file.name);
      }
      
      const uploadData = await uploadResponse.json();
      console.log('📦 Upload data:', uploadData);
      
      if (!uploadData.data || !uploadData.data.url) {
        console.error('❌ No URL in tmpfiles.org response');
        // Fallback vers file.io
        console.log('🔄 Trying fallback service: file.io...');
        return await uploadToFileIo(blob, file.name);
      }
      
      // Convertir l'URL pour téléchargement direct
      let publicUrl = uploadData.data.url;
      publicUrl = publicUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      
      console.log('✅ Public URL (tmpfiles.org):', publicUrl);
      
      return NextResponse.json({
        success: true,
        url: publicUrl,
        expiresIn: '1 hour',
        service: 'tmpfiles.org'
      });
      
    } catch (uploadError) {
      clearTimeout(timeoutId);
      
      console.error('❌ tmpfiles.org error:', uploadError);
      
      // Fallback vers file.io pour TOUTES les erreurs
      console.log('🔄 Trying fallback service: file.io...');
      return await uploadToFileIo(blob, file.name);
    }
    
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

// Fonction de fallback pour file.io
async function uploadToFileIo(blob: Blob, filename: string) {
  try {
    const formData = new FormData();
    formData.append('file', blob, filename);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch('https://file.io', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`file.io upload failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📦 file.io response:', data);
    
    if (!data.success || !data.link) {
      throw new Error('No URL in file.io response');
    }
    
    console.log('✅ Public URL (file.io):', data.link);
    
    return NextResponse.json({
      success: true,
      url: data.link,
      expiresIn: '14 jours',
      service: 'file.io'
    });
    
  } catch (error) {
    console.error('❌ file.io error:', error);
    
    // Dernier fallback: 0x0.st
    console.log('🔄 Trying last fallback service: 0x0.st...');
    return await uploadTo0x0(blob, filename);
  }
}

// Dernier fallback: 0x0.st (expire après 365 jours)
async function uploadTo0x0(blob: Blob, filename: string) {
  try {
    const formData = new FormData();
    formData.append('file', blob, filename);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch('https://0x0.st', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`0x0.st upload failed: ${response.statusText}`);
    }
    
    const url = await response.text();
    console.log('📦 0x0.st response:', url);
    
    if (!url || !url.startsWith('http')) {
      throw new Error('Invalid URL from 0x0.st');
    }
    
    console.log('✅ Public URL (0x0.st):', url.trim());
    
    return NextResponse.json({
      success: true,
      url: url.trim(),
      expiresIn: '1 an',
      service: '0x0.st'
    });
    
  } catch (error) {
    console.error('❌ 0x0.st error:', error);
    
    // Dernier fallback: stockage local
    console.log('🔄 Trying local storage fallback...');
    return await uploadToLocal(blob, filename);
  }
}

// Fallback ultime: stockage local
async function uploadToLocal(blob: Blob, filename: string) {
  try {
    const formData = new FormData();
    formData.append('file', blob, filename);
    
    const response = await fetch('/api/upload-temp-pdf-local', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Local storage failed');
    }
    
    const data = await response.json();
    console.log('✅ File stored locally');
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Local storage error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Tous les services d\'upload sont indisponibles. Veuillez réessayer plus tard.' 
      },
      { status: 503 }
    );
  }
}
