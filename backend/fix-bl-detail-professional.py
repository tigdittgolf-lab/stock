#!/usr/bin/env python3
"""
Script professionnel pour corriger automatiquement l'endpoint BL détail
"""

import re

def fix_bl_detail_endpoint():
    file_path = 'src/routes/sales-clean.ts'
    
    print('🔧 Fixing BL detail endpoint professionally...')
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Trouver l'endpoint de détail
        start_pattern = r"// GET /api/sales/delivery-notes/:id - Récupérer un bon de livraison spécifique\s*sales\.get\('/delivery-notes/:id', async \(c\) => \{"
        
        match = re.search(start_pattern, content)
        if not match:
            print('❌ Could not find BL detail endpoint start')
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
                    remaining = content[i:i+10]
                    if remaining.startswith('});'):
                        end_pos = i + 3
                        break
        
        if end_pos == start_pos:
            print('❌ Could not find BL detail endpoint end')
            return False
        
        # Nouveau code professionnel pour l'endpoint de détail
        new_detail_endpoint = """// GET /api/sales/delivery-notes/:id - Récupérer un bon de livraison spécifique
sales.get('/delivery-notes/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    const id = c.req.param('id');
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const blId = parseInt(id);
    if (isNaN(blId)) {
      return c.json({ success: false, error: 'Invalid BL ID' }, 400);
    }

    console.log(`📋 Fetching REAL delivery note ${blId} for tenant: ${tenant}`);

    // Utiliser la fonction RPC pour récupérer le BL avec détails
    const { data: blResult, error: blError } = await supabaseAdmin.rpc('get_bl_with_details', {
      p_tenant: tenant,
      p_nfact: blId
    });

    if (blError) {
      console.error('❌ Failed to fetch REAL BL details:', blError);
      return c.json({ success: false, error: 'BL not found' }, 404);
    }

    if (!blResult || blResult.error) {
      return c.json({ success: false, error: 'BL not found' }, 404);
    }

    console.log(`✅ Found REAL delivery note ${blId} with ${blResult.details?.length || 0} items`);

    return c.json({
      success: true,
      data: blResult,
      source: 'real_database_via_rpc'
    });

  } catch (error) {
    console.error('❌ Error fetching REAL delivery note:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération du bon de livraison'
    }, 500);
  }
});"""
        
        # Remplacer l'ancien code par le nouveau
        new_content = content[:start_pos] + new_detail_endpoint + content[end_pos:]
        
        # Écrire le fichier corrigé
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print('✅ BL detail endpoint fixed successfully!')
        print(f'📝 Replaced {end_pos - start_pos} characters')
        print('🔄 Please restart the backend server')
        return True
        
    except Exception as e:
        print(f'❌ Error: {e}')
        return False

if __name__ == '__main__':
    success = fix_bl_detail_endpoint()
    exit(0 if success else 1)