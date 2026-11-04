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
