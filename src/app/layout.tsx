import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import { AuthProvider } from '@/contexts/AuthContext'

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
      <body className="bg-white text-gray-900 font-sans antialiased">
        <AuthProvider>
          <Navigation />
          <main>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
