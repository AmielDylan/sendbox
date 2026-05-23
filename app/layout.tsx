import type { Metadata } from 'next'
import { Space_Grotesk, Figtree } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from './providers'
import './globals.css'

// Force dynamic rendering for all pages (uses auth context via Providers)
export const dynamic = 'force-dynamic'

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-heading',
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
        url: 'https://www.gosendbox.com/images/opengraph.jpg',
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
    images: ['https://www.gosendbox.com/images/opengraph.jpg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      className={`${figtree.variable} ${spaceGrotesk.variable} light`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
