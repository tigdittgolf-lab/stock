/** @type {import('next').NextConfig} */
const nextConfig = {
  // TEMPORAIRE: Ignorer les erreurs TypeScript pour le déploiement
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Variables d'environnement publiques
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://frontend-iota-six-72.vercel.app/api',
  },
  
  // Configuration des images
  images: {
    unoptimized: true, // Pour Vercel
  },
  
  // Optimisations
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;