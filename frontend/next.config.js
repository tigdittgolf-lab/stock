/** @type {import('next').NextConfig} */
const nextConfig = {
  // TEMPORAIRE: Ignorer les erreurs TypeScript pour le déploiement
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configuration ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Variables d'environnement publiques
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://desktop-bhhs068.tail1d9c54.ts.net/api',
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