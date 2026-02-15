import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 API: Upload temp PDF request received (LOCAL)');
    
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
    
    // Créer le dossier temp s'il n'existe pas
    const tempDir = join(process.cwd(), 'public', 'temp-pdfs');
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }
    
    // Générer un nom de fichier unique avec timestamp
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}_${randomId}_${file.name}`;
    const filePath = join(tempDir, fileName);
    
    // Sauvegarder le fichier
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);
    
    console.log('✅ File saved locally:', fileName);
    
    // Générer l'URL publique
    const publicUrl = `/temp-pdfs/${fileName}`;
    
    // Programmer la suppression après 1 heure
    setTimeout(async () => {
      try {
        const { unlink } = await import('fs/promises');
        await unlink(filePath);
        console.log('🗑️ Temp file deleted:', fileName);
      } catch (error) {
        console.error('❌ Error deleting temp file:', error);
      }
    }, 3600000); // 1 heure
    
    return NextResponse.json({
      success: true,
      url: publicUrl,
      expiresIn: '1 heure',
      service: 'local'
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
