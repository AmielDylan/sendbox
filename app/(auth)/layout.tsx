import { PublicHeader } from '@/components/layouts/PublicHeader'
import { DotPattern } from '@/components/ui/dot-pattern'

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
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        <DotPattern
          width={20}
          height={20}
          cx={1}
          cy={1}
          cr={1}
          className="fill-muted-foreground/15"
        />
        <div className="relative z-10 w-full max-w-md animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  )
}
