import type { Metadata } from 'next'
import { Fraunces, Space_Grotesk } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from './providers'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

const siteTitle = 'Sendbox - Covalisage Europe Afrique'
const siteDescription =
  "Plateforme de covalisage international entre l'Europe et l'Afrique. Actuellement disponible entre la France et le Bénin"

export const metadata: Metadata = {
  metadataBase: new URL('https://sendbox-bj.vercel.app'),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    url: 'https://sendbox-bj.vercel.app/',
    type: 'website',
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: '/images/hero-background.jpg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/images/hero-background.jpg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${spaceGrotesk.variable} light`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
