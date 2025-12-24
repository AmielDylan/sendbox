/**
 * Layout pour les routes publiques
 * (page d'accueil, à propos, etc.)
 */

import { PublicHeader } from '@/components/layouts/PublicHeader'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}








