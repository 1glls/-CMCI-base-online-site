import React from "react"
import type { Metadata, Viewport } from 'next'
import { Montserrat, Open_Sans } from 'next/font/google'
import { LanguageProvider } from '@/contexts/LanguageContext'
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

export const metadata: Metadata = {
  metadataBase: new URL('https://www.cmcibelgique.org'),
  title: 'CMCI Belgique - Communaute Missionnaire Chretienne Internationale',
  description: 'Rejoignez la CMCI Belgique - Une communaute de disciples devoues a Jesus-Christ, notre modele en toutes choses. Decouvrez notre vision, nos valeurs et nos assemblees.',
  keywords: ['CMCI', 'Belgique', 'eglise', 'chretien', 'communaute', 'missionnaire', 'Bruxelles', 'culte', 'priere'],
  generator: 'v0.app',
  verification: {
    google: 'Z0jrhdY3JojQh64BINvb-fjvBQEBFffumX_A1zak2Is',
  },
  alternates: {
    canonical: 'https://www.cmcibelgique.org',
  },
  openGraph: {
    title: 'CMCI Belgique - Communaute Missionnaire Chretienne Internationale',
    description: 'Une communaute de disciples devoues a Jesus-Christ',
    url: 'https://www.cmcibelgique.org',
    siteName: 'CMCI Belgique',
    type: 'website',
    locale: 'fr_BE',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.png',
        type: 'image/png',
      },
    ],
    apple: '/apple-icon.png',
    shortcut: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a365d',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`font-sans antialiased`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
