#!/usr/bin/env node

/**
 * Script pour créer un nouveau déploiement Vercel sans protection
 */

const fs = require('fs');

console.log('🚀 CRÉATION DÉPLOIEMENT VERCEL SANS PROTECTION');
console.log('==============================================');

// 1. Créer une nouvelle configuration Vercel
const vercelConfig = {
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "NEXT_PUBLIC_API_URL": "https://enabled-encourage-mechanics-performance.trycloudflare.com/api"
  },
  "functions": {
    "frontend/pages/api/**/*.js": {
      "maxDuration": 30
    }
  }
};

console.log('1️⃣ Création de la configuration Vercel...');
fs.writeFileSync('vercel-no-protection.json', JSON.stringify(vercelConfig, null, 2));
console.log('✅ Configuration sauvegardée dans vercel-no-protection.json');

// 2. Créer un script de déploiement
const deployScript = `#!/bin/bash

echo "🚀 DÉPLOIEMENT VERCEL SANS PROTECTION"
echo "===================================="

# Étape 1: Copier la nouvelle configuration
echo "1️⃣ Configuration Vercel..."
cp vercel-no-protection.json vercel.json

# Étape 2: Configurer les variables d'environnement
echo "2️⃣ Variables d'environnement..."
vercel env add NEXT_PUBLIC_API_URL production
# Entrer: https://enabled-encourage-mechanics-performance.trycloudflare.com/api

vercel env add NODE_ENV production  
# Entrer: production

# Étape 3: Déployer
echo "3️⃣ Déploiement..."
cd frontend
vercel --prod --force

echo "✅ Déploiement terminé !"
echo "🔗 Vérifiez votre nouvelle URL de déploiement"
`;

fs.writeFileSync('deploy-no-protection.sh', deployScript);
console.log('✅ Script de déploiement créé: deploy-no-protection.sh');

// 3. Créer un script PowerShell pour Windows
const deployScriptPS = `# DÉPLOIEMENT VERCEL SANS PROTECTION

Write-Host "🚀 DÉPLOIEMENT VERCEL SANS PROTECTION" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Étape 1: Copier la nouvelle configuration
Write-Host "1️⃣ Configuration Vercel..." -ForegroundColor Blue
Copy-Item "vercel-no-protection.json" "vercel.json" -Force

# Étape 2: Aller dans le dossier frontend
Write-Host "2️⃣ Déploiement..." -ForegroundColor Blue
Set-Location "frontend"

# Étape 3: Déployer avec force
Write-Host "3️⃣ Lancement du déploiement..." -ForegroundColor Blue
vercel --prod --force

Write-Host "✅ Déploiement terminé !" -ForegroundColor Green
Write-Host "🔗 Vérifiez votre nouvelle URL de déploiement" -ForegroundColor Yellow
`;

fs.writeFileSync('deploy-no-protection.ps1', deployScriptPS);
console.log('✅ Script PowerShell créé: deploy-no-protection.ps1');

// 4. Instructions détaillées
const instructions = `# 🚀 INSTRUCTIONS DÉPLOIEMENT SANS PROTECTION

## PROBLÈME IDENTIFIÉ
La protection Vercel est toujours active malgré la désactivation dans les paramètres.

## SOLUTION: NOUVEAU DÉPLOIEMENT

### Méthode 1: Script Automatique (Recommandé)

\`\`\`powershell
# Exécuter le script PowerShell
.\\deploy-no-protection.ps1
\`\`\`

### Méthode 2: Manuelle

\`\`\`bash
# 1. Copier la nouvelle configuration
cp vercel-no-protection.json vercel.json

# 2. Configurer les variables (si pas encore fait)
vercel env add NEXT_PUBLIC_API_URL production
# Entrer: https://enabled-encourage-mechanics-performance.trycloudflare.com/api

# 3. Déployer
cd frontend
vercel --prod --force
\`\`\`

### Méthode 3: Créer un Nouveau Projet

Si le problème persiste:

1. **Créer un nouveau projet Vercel:**
   \`\`\`bash
   vercel --name st-article-no-protection
   \`\`\`

2. **Configurer sans protection dès le début**

## VÉRIFICATION

Après déploiement, tester:

\`\`\`bash
# Test de la nouvelle URL
node test-final-challenge.js
\`\`\`

## RÉSULTAT ATTENDU

- ✅ Application accessible sans protection Vercel
- ✅ Connexion admin/admin123 fonctionnelle
- ✅ Switch entre bases de données opérationnel

## NOUVELLE URL

Après déploiement, vous obtiendrez une nouvelle URL comme:
\`https://st-article-1-xyz123-tigdittgolf-9191s-projects.vercel.app\`

Mettez à jour cette URL dans les tests !
`;

fs.writeFileSync('DEPLOY_NO_PROTECTION_GUIDE.md', instructions);
console.log('✅ Guide créé: DEPLOY_NO_PROTECTION_GUIDE.md');

console.log('\n🎯 PROCHAINES ÉTAPES:');
console.log('1. Exécuter: .\\deploy-no-protection.ps1');
console.log('2. Ou suivre DEPLOY_NO_PROTECTION_GUIDE.md');
console.log('3. Tester avec la nouvelle URL');

console.log('\n📋 FICHIERS CRÉÉS:');
console.log('- vercel-no-protection.json (configuration)');
console.log('- deploy-no-protection.ps1 (script PowerShell)');
console.log('- DEPLOY_NO_PROTECTION_GUIDE.md (guide détaillé)');