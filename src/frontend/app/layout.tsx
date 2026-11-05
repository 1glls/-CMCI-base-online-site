import React from "react"
import type { Metadata, Viewport } from 'next'
import { Montserrat, Open_Sans, Cormorant_Garamond } from 'next/font/google'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ThemeProvider } from '@/components/theme-provider'
import { TimingProvider } from '@/components/site/timing-provider'
import { fetchSettings } from '@/lib/server-data'
import { parseTimings } from '@/lib/timings'
// Cinzel est auto-hebergee (@fontsource) : Google la sert desormais via des
// URL « l/font?kit=… » que next/font (Turbopack) ne sait pas resoudre.
import '@fontsource/cinzel/latin-400.css'
import '@fontsource/cinzel/latin-600.css'
import './globals.css'

const _montserrat = Montserrat({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat'
});

const _openSans = Open_Sans({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-open-sans'
});

// Charte « Nuit & or » : titres en Garamond, surtitres en capitales gravees
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
});


export const metadata: Metadata = {
  metadataBase: new URL('https://www.cmcibelgique.org'),
  title: 'CMCI Belgique - Communauté Missionnaire Chrétienne Internationale',
  description: 'Rejoignez la CMCI Belgique - Une communauté de disciples dévoués à Jésus-Christ, notre modèle en toutes choses. Découvrez notre vision, nos valeurs et nos assemblées.',
  keywords: ['CMCI', 'Belgique', 'église', 'chrétien', 'communauté', 'missionnaire', 'Bruxelles', 'culte', 'prière'],
  verification: {
    google: 'Z0jrhdY3JojQh64BINvb-fjvBQEBFffumX_A1zak2Is',
  },
  // Pas de canonical ici : herite par toutes les pages, il declarerait
  // /livres, chaque livre et chaque tract comme copies de l'accueil.
  // Chaque page publique declare le sien.
  openGraph: {
    title: 'CMCI Belgique - Communauté Missionnaire Chrétienne Internationale',
    description: 'Une communauté de disciples dévoués à Jésus-Christ',
    siteName: 'CMCI Belgique',
    type: 'website',
    locale: 'fr_BE',
    images: ['/cmci-logo.png'],
  },
  icons: {
    // Logo adapte (arc or, medaillon, drapeau) detoure, fond transparent
    // (cf. otherthings/make_icons.py).
    icon: [
      // ?v= : change a chaque nouvelle icone, sinon les navigateurs gardent l'ancienne en cache
      { url: '/favicon.ico?v=3', sizes: '48x48' },
      { url: '/icon.png?v=3', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/apple-icon.png?v=3',
    shortcut: '/favicon.ico?v=3',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a365d',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Durees de defilement reglees dans l'admin (Parametres → Rythmes et automatismes)
  const timings = parseTimings(await fetchSettings())
  return (
    // suppressHydrationWarning : next-themes pose data-theme avant l'affichage
    // (pas de flash), donc l'attribut differe volontairement du rendu serveur.
    <html lang="fr" className={cormorant.variable} suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        {/* Theme sombre par defaut (charte Nuit & or), clair au choix du visiteur */}
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false} storageKey="cmci-theme">
          <LanguageProvider>
            <TimingProvider value={timings}>{children}</TimingProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
