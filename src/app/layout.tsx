import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import { AuthProvider } from '@/contexts/AuthContext'

import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Green Box Barbados - Vegan Food Delivery',
    template: '%s | Green Box Barbados'
  },
  description: '100% vegan food delivery service in Barbados. Handmade with love using whole ingredients and global inspiration. Order via WhatsApp for delivery or take-away.',
  keywords: ['vegan', 'barbados', 'food delivery', 'plant-based', 'healthy food', 'caribbean'],
  authors: [{ name: 'Green Box Barbados' }],
  creator: 'Green Box Barbados',
  publisher: 'Green Box Barbados',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.jpeg', sizes: '32x32', type: 'image/jpeg' },
    ],
    apple: [
      { url: '/logo.jpeg', sizes: '180x180', type: 'image/jpeg' },
    ],
    shortcut: '/favicon.ico',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://greenboxbarbados.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_BB',
    url: '/',
    title: 'Green Box Barbados - Vegan Food Delivery',
    description: '100% vegan food delivery service in Barbados. Handmade with love using whole ingredients and global inspiration.',
    siteName: 'Green Box Barbados',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Green Box Barbados - Vegan Food Delivery',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Green Box Barbados - Vegan Food Delivery',
    description: '100% vegan food delivery service in Barbados. Handmade with love using whole ingredients and global inspiration.',
    images: ['/og-image.jpg'],
    creator: '@greenboxbarbados',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/logo.jpeg?v=1" type="image/jpeg" />
        <link rel="shortcut icon" href="/logo.jpeg?v=1" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/logo.jpeg?v=1" />
      </head>
      <body className="bg-white text-gray-900 font-sans antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <Navigation />
            <main>
              {children}
            </main>
    
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
