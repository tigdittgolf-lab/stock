#!/bin/bash

# Script pour configurer les variables d'environnement Vercel
# Usage: ./setup-vercel-env.sh

echo "🚀 Configuration des variables d'environnement Vercel..."
echo ""

# Vérifier si vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    echo "📦 Installation: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI détecté"
echo ""

# Se connecter à Vercel
echo "🔐 Connexion à Vercel..."
vercel login

echo ""
echo "📝 Ajout des variables d'environnement..."
echo ""

# NEXT_PUBLIC_SUPABASE_URL
echo "1/4 - NEXT_PUBLIC_SUPABASE_URL"
echo "https://szgodrjglbpzkrksnroi.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "https://szgodrjglbpzkrksnroi.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview
echo "https://szgodrjglbpzkrksnroi.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL development

# SUPABASE_SERVICE_ROLE_KEY
echo "2/4 - SUPABASE_SERVICE_ROLE_KEY"
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU" | vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU" | vercel env add SUPABASE_SERVICE_ROLE_KEY preview
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU" | vercel env add SUPABASE_SERVICE_ROLE_KEY development

# NEXT_PUBLIC_SUPABASE_ANON_KEY
echo "3/4 - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development

# SUPABASE_URL (sans NEXT_PUBLIC)
echo "4/4 - SUPABASE_URL"
echo "https://szgodrjglbpzkrksnroi.supabase.co" | vercel env add SUPABASE_URL production
echo "https://szgodrjglbpzkrksnroi.supabase.co" | vercel env add SUPABASE_URL preview
echo "https://szgodrjglbpzkrksnroi.supabase.co" | vercel env add SUPABASE_URL development

echo ""
echo "✅ Variables d'environnement configurées!"
echo ""
echo "📋 Vérification..."
vercel env ls

echo ""
echo "🚀 Redéploiement en production..."
vercel --prod

echo ""
echo "✅ Configuration terminée!"
echo "🌐 Votre application sera disponible dans 2-3 minutes"
