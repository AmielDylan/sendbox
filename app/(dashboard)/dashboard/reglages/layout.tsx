/**
 * Layout pour les pages de réglages
 */

import { Suspense } from 'react'
import { createClient } from "@/lib/shared/db/server"
import { SettingsNav } from '@/components/layouts/SettingsNav'
import { Skeleton } from '@/components/ui/skeleton'

async function SettingsLayoutContent({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  let kycStatus: 'pending' | 'approved' | 'rejected' | 'incomplete' | null | undefined = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('kyc_status')
      .eq('id', user.id)
      .single()

    kycStatus = profile?.kyc_status as any
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-72 lg:w-80">
        <div className="sticky top-4">
          <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Réglages</h2>
            <p className="text-sm text-muted-foreground">
              Gérez votre compte et vos préférences
            </p>
          </div>
          <SettingsNav kycStatus={kycStatus} />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<SettingsLayoutSkeleton />}>
      <SettingsLayoutContent>{children}</SettingsLayoutContent>
    </Suspense>
  )
}

function SettingsLayoutSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <aside className="w-full md:w-72 lg:w-80">
        <div className="mb-4">
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-60" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </aside>
      <div className="flex-1">
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  )
}








