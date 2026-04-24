import { PublicHeader } from '@/components/layouts/PublicHeader'

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
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  )
}
