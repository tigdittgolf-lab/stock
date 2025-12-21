#!/usr/bin/env python3
"""
Script professionnel pour corriger automatiquement le mapping des données RPC dans pdf.ts
"""

import re

def fix_pdf_data_mapping():
    file_path = 'src/routes/pdf.ts'
    
    print('🔧 Fixing PDF data mapping professionally...')
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Corrections à appliquer
        corrections = [
            # Corriger nfact -> nbl pour les données RPC
            (r'nfact: blData\.nfact \|\| blData\.nfact', 'nfact: blData.nbl || blData.nfact'),
            
            # Corriger les autres mappings si nécessaire
            (r'nfact: blData\.nfact', 'nfact: blData.nbl || blData.nfact'),
        ]
        
        # Appliquer les corrections
        for pattern, replacement in corrections:
            old_content = content
            content = re.sub(pattern, replacement, content)
            if content != old_content:
                print(f'✅ Applied correction: {pattern} -> {replacement}')
        
        # Écrire le fichier corrigé
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print('✅ PDF data mapping fixed successfully!')
        print('🔄 Please restart the backend server')
        return True
        
    except Exception as e:
        print(f'❌ Error: {e}')
        return False

if __name__ == '__main__':
    success = fix_pdf_data_mapping()
    exit(0 if success else 1)