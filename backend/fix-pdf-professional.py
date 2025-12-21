#!/usr/bin/env python3
"""
Script professionnel pour corriger automatiquement la fonction fetchBLData dans pdf.ts
"""

import re

def fix_pdf_fetchbldata():
    file_path = 'src/routes/pdf.ts'
    
    print('🔧 Fixing PDF fetchBLData function professionally...')
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Trouver la fonction fetchBLData
        start_pattern = r"// Utility function to fetch BL data consistently\s*async function fetchBLData\(tenant: string, id: string\) \{"
        
        match = re.search(start_pattern, content)
        if not match:
            print('❌ Could not find fetchBLData function start')
            return False
        
        start_pos = match.start()
        
        # Trouver la fin de la fonction
        brace_count = 0
        in_function = False
        end_pos = start_pos
        
        for i in range(start_pos, len(content)):
            char = content[i]
            
            if char == '{':
                brace_count += 1
                in_function = True
            elif char == '}':
                brace_count -= 1
                
                if in_function and brace_count == 0:
                    end_pos = i + 1
                    break
        
        if end_pos == start_pos:
            print('❌ Could not find fetchBLData function end')
            return False
        
        # Nouvelle fonction professionnelle utilisant RPC
        new_fetchbldata_function = """// Utility function to fetch BL data consistently
async function fetchBLData(tenant: string, id: string) {
  const requestedId = parseInt(id);
  
  if (isNaN(requestedId)) {
    throw new Error(`Invalid BL ID: ${id}`);
  }

  console.log(`📋 PDF: Fetching REAL BL data ${requestedId} for tenant: ${tenant}`);

  // Utiliser la fonction RPC pour récupérer le BL avec détails
  const { data: blResult, error: blError } = await supabaseAdmin.rpc('get_bl_with_details', {
    p_tenant: tenant,
    p_nfact: requestedId
  });

  if (blError) {
    console.error('❌ PDF: Failed to fetch REAL BL data:', blError);
    throw new Error(`Failed to fetch BL data: ${blError.message}`);
  }

  if (!blResult || blResult.error) {
    throw new Error(`BL ${requestedId} not found`);
  }

  console.log(`✅ PDF: Found REAL BL data ${requestedId} with ${blResult.details?.length || 0} items`);

  return blResult;
}"""
        
        # Remplacer l'ancienne fonction par la nouvelle
        new_content = content[:start_pos] + new_fetchbldata_function + content[end_pos:]
        
        # Écrire le fichier corrigé
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print('✅ PDF fetchBLData function fixed successfully!')
        print(f'📝 Replaced {end_pos - start_pos} characters')
        print('🔄 Please restart the backend server')
        return True
        
    except Exception as e:
        print(f'❌ Error: {e}')
        return False

if __name__ == '__main__':
    success = fix_pdf_fetchbldata()
    exit(0 if success else 1)