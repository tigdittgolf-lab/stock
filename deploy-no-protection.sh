#!/bin/bash

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
