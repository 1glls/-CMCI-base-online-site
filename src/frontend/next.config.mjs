import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Le depot contient deux fichiers de verrouillage (racine et src/frontend) :
  // sans racine explicite, Turbopack prend la racine du depot et ne voit plus
  // certaines modifications (CSS servie perimee en developpement).
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  // Le HTML embarque des chemins relatifs de l'API (couvertures « /api/books/…/cover »,
  // fichiers « /uploads/… »). Google les resout contre www et tombait sur des 404 :
  // on les renvoie vers le vrai serveur de l'API.
  async redirects() {
    const api = process.env.NEXT_PUBLIC_API_URL || 'https://api.cmcibelgique.org'
    if (!/^https?:\/\//.test(api) || api.includes('localhost')) return []
    return [
      { source: '/api/:path*', destination: `${api}/api/:path*`, permanent: true },
      { source: '/uploads/:path*', destination: `${api}/uploads/:path*`, permanent: true },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
  },
}

export default nextConfig
