/**
 * Layout pour les routes d'authentification
 * Design avec sidebar sticky intelligente
 */

import { PublicFooter } from '@/components/layouts/PublicFooter'
import { PublicHeader } from '@/components/layouts/PublicHeader'
import { AuthSidebar } from '@/components/auth/AuthSidebar'

// Force dynamic rendering for auth pages (use auth context)
export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 relative lg:grid lg:grid-cols-2">
        {/* Sidebar - Left Half (50%) - Sticky */}
        <div className="hidden lg:flex relative bg-gradient-to-br from-primary/5 via-background to-emerald-500/5">
          {/* Decorative blur elements */}
          <div
            className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"
            aria-hidden="true"
          />

          {/* Sticky container */}
          <div className="sticky top-0 h-screen w-full overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-8 lg:p-12">
              <AuthSidebar />
            </div>
          </div>
        </div>

        {/* Form - Right Half (50%) - Scrollable */}
        <div className="relative bg-background">
          {/* Mobile gradient background (visible only on small screens) */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5 lg:hidden"
            aria-hidden="true"
          />

          <div className="relative flex items-center justify-center min-h-screen p-4 sm:p-8 lg:p-12">
            <div className="w-full max-w-lg animate-fade-in-up">{children}</div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
