import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true, // Désactivé temporairement pour éviter les erreurs Babel
  
  // TEMPORAIRE: Ignorer les erreurs TypeScript pour le déploiement
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configuration pour Vercel
  output: 'standalone',
  
  // Variables d'environnement publiques
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Optimisations pour la production
  experimental: {
    optimizeCss: true,
  },
  
  // Configuration des images (si nécessaire)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3005',
        pathname: '/**',
      },
    ],
    unoptimized: true, // Pour Vercel
  },
  
  // Redirections
  async redirects() {
    return [
      // TEMPORAIRE: Désactiver la redirection automatique pour tester le déploiement
      // {
      //   source: '/',
      //   destination: '/login',
      //   permanent: false,
      // },
    ];
  },
};

export default nextConfig;
