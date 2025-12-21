#!/usr/bin/env python3
"""
Script professionnel pour corriger automatiquement l'endpoint BL
Utilise une analyse syntaxique robuste
"""

import re
import sys

def fix_bl_endpoint():
    file_path = 'src/routes/sales-clean.ts'
    
    print('🔧 Fixing BL endpoint professionally...')
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Trouver le début de l'endpoint
        start_pattern = r"// GET /api/sales/delivery-notes - Récupérer la liste des bons de livraison\s*sales\.get\('/delivery-notes', async \(c\) => \{"
        
        match = re.search(start_pattern, content)
        if not match:
            print('❌ Could not find BL endpoint start')
            return False
        
        start_pos = match.start()
        
        # Trouver la fin de la fonction en comptant les accolades
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
                    # Trouver le ); après le }
                    remaining = content[i:i+10]
                    if remaining.startswith('});'):
                        end_pos = i + 3
                        break
        
        if end_pos == start_pos:
            print('❌ Could not find BL endpoint end')
            return False
        
        # Nouveau code professionnel
        new_endpoint = """// GET /api/sales/delivery-notes - Récupérer la liste des bons de livraison
sales.get('/delivery-notes', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`📋 Fetching REAL delivery notes for tenant: ${tenant}`);

    const { data: blData, error: blError } = await supabaseAdmin.rpc('get_bl_list_by_tenant', {
      p_tenant: tenant
    });

    if (blError) {
      console.error('❌ Failed to fetch REAL BL data:', blError);
      return c.json({
        success: true,
        data: [],
        message: 'Failed to fetch REAL BL data - RPC error',
        tenant: tenant,
        source: 'fallback'
      });
    }

    const enrichedBL = (blData || []).map(bl => ({
      id: bl.nfact,
      nbl: bl.nfact,
      nclient: bl.nclient,
      client_name: bl.client_name || bl.nclient,
      date_fact: bl.date_fact,
      montant_ht: parseFloat(bl.montant_ht || '0'),
      tva: parseFloat(bl.tva || '0'),
      montant_ttc: parseFloat(bl.montant_ht || '0') + parseFloat(bl.tva || '0'),
      created_at: bl.created_at,
      type: 'bl'
    }));

    console.log(`✅ Found ${enrichedBL.length} REAL delivery notes from database via RPC`);

    return c.json({
      success: true,
      data: enrichedBL,
      tenant: tenant,
      source: 'real_database_via_rpc'
    });

  } catch (error) {
    console.error('❌ Error fetching REAL delivery notes:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération des bons de livraison'
    }, 500);
  }
});"""
        
        # Remplacer l'ancien code par le nouveau
        new_content = content[:start_pos] + new_endpoint + content[end_pos:]
        
        # Écrire le fichier corrigé
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print('✅ BL endpoint fixed successfully!')
        print(f'📝 Replaced {end_pos - start_pos} characters')
        print('🔄 Please restart the backend server')
        return True
        
    except Exception as e:
        print(f'❌ Error: {e}')
        return False

if __name__ == '__main__':
    success = fix_bl_endpoint()
    sys.exit(0 if success else 1)
