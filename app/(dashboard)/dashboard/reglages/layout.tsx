/**
 * Layout pour les pages de réglages
 */

import { Suspense } from 'react'
import { createClient } from '@/lib/shared/db/server'
import { SettingsNav } from '@/components/layouts/SettingsNav'
import { SettingsBreadcrumb } from '@/components/layouts/SettingsBreadcrumb'
import { Skeleton } from '@/components/ui/skeleton'

async function SettingsLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let kycStatus:
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'incomplete'
    | null
    | undefined = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('kyc_status')
      .eq('id', user.id)
      .single()

    kycStatus = profile?.kyc_status as any
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar navigation */}
      <aside className="w-full lg:w-72 xl:w-80">
        <div className="sticky top-6 space-y-4">
          <div className="space-y-1">
            <SettingsBreadcrumb />
            <h2 className="text-xl font-semibold">Centre de compte</h2>
            <p className="text-sm text-muted-foreground">
              Gérez votre compte et vos préférences
            </p>
          </div>
          <div className="rounded-md border bg-background">
            <SettingsNav kycStatus={kycStatus} />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 max-w-3xl">{children}</div>
    </div>
  )
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<SettingsLayoutSkeleton />}>
      <SettingsLayoutContent>{children}</SettingsLayoutContent>
    </Suspense>
  )
}

function SettingsLayoutSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="w-full lg:w-72 xl:w-80">
        <div className="space-y-3">
          <Skeleton className="h-3 w-52" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </aside>
      <div className="flex-1 max-w-3xl">
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  )
}
