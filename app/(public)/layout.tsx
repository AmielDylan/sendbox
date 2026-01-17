/**
 * Layout pour les routes publiques
 * (page d'accueil, à propos, etc.)
 */

import { PublicHeader } from '@/components/layouts/PublicHeader'
import { PublicFooter } from '@/components/layouts/PublicFooter'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}








