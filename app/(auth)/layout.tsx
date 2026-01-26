/**
 * Layout pour les routes d'authentification
 * Design épuré centré sur le formulaire
 */

import { PublicFooter } from '@/components/layouts/PublicFooter'
import { PublicHeader } from '@/components/layouts/PublicHeader'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 relative">
        {/* Atmospheric gradient background */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5"
          aria-hidden="true"
        />

        {/* Subtle decorative elements */}
        <div
          className="absolute top-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-20 left-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"
          aria-hidden="true"
        />

        {/* Centered form container */}
        <div className="container-wide relative z-10 flex items-center justify-center py-12 sm:py-16 lg:py-20 px-4">
          <div className="w-full max-w-lg animate-fade-in-up">
            {children}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
