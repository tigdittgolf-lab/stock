#!/bin/bash

# 🚀 Script de déploiement Vercel automatique

echo "🚀 Déploiement sur Vercel - Système de Gestion de Stock"
echo "=================================================="

# Vérifier si on est dans le bon répertoire
if [ ! -f "package.json" ] && [ ! -f "frontend/package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

# Vérifier si Git est propre
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Il y a des changements non commités"
    read -p "Voulez-vous les commiter automatiquement ? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "feat: Préparation déploiement Vercel $(date '+%Y-%m-%d %H:%M')"
        git push origin main
        echo "✅ Changements commités et poussés"
    else
        echo "❌ Déploiement annulé - Commitez vos changements d'abord"
        exit 1
    fi
fi

# Vérifier les dépendances
echo "📦 Vérification des dépendances..."

if [ -d "frontend" ]; then
    cd frontend
    if [ ! -d "node_modules" ]; then
        echo "📥 Installation des dépendances frontend..."
        bun install
    fi
    cd ..
fi

if [ -d "backend" ]; then
    cd backend
    if [ ! -d "node_modules" ]; then
        echo "📥 Installation des dépendances backend..."
        bun install
    fi
    cd ..
fi

# Vérifier la configuration
echo "🔧 Vérification de la configuration..."

if [ ! -f "vercel.json" ]; then
    echo "❌ Fichier vercel.json manquant"
    exit 1
fi

if [ ! -f "frontend/.env.production" ]; then
    echo "⚠️  Fichier .env.production manquant dans frontend/"
    echo "💡 Créez-le avec vos variables Supabase"
fi

# Test de build local (optionnel)
read -p "🧪 Voulez-vous tester le build localement ? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔨 Test de build frontend..."
    cd frontend
    bun run build
    if [ $? -ne 0 ]; then
        echo "❌ Erreur de build frontend"
        exit 1
    fi
    cd ..
    echo "✅ Build frontend réussi"
fi

# Déploiement
echo "🚀 Lancement du déploiement Vercel..."

# Installer Vercel CLI si nécessaire
if ! command -v vercel &> /dev/null; then
    echo "📥 Installation de Vercel CLI..."
    npm install -g vercel
fi

# Déployer
vercel --prod

echo "🎉 Déploiement terminé !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Configurer les variables d'environnement dans Vercel Dashboard"
echo "2. Tester l'application déployée"
echo "3. Configurer le domaine personnalisé (optionnel)"
echo ""
echo "🔗 Liens utiles :"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- Documentation: https://vercel.com/docs"