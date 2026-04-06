/**
 * Layout pour les pages de réglages
 */

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<SettingsLayoutSkeleton />}>
      <div className="min-w-0 w-full">{children}</div>
    </Suspense>
  )
}

function SettingsLayoutSkeleton() {
  return <Skeleton className="h-96 w-full" />
}
