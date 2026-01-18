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
  metadataBase: new URL('https://www.gosendbox.com'),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    url: 'https://www.gosendbox.com/',
    type: 'website',
    siteName: 'Sendbox',
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: 'https://www.gosendbox.com/images/opengraph.png',
        width: 1200,
        height: 630,
        alt: 'Sendbox - Covalisage Europe Afrique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['https://www.gosendbox.com/images/opengraph.png'],
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
