/**
 * Layout pour les pages admin
 * Protection server-side + UI déléguée à AdminLayout
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { isAdmin } from "@/lib/core/admin/actions"
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { IconLoader2 } from '@tabler/icons-react'

export default async function AdminLayoutRoute({
  children,
}: {
  children: React.ReactNode
}) {
  // Defense-in-depth: server-side auth check
  const admin = await isAdmin()

  if (!admin) {
    redirect('/')
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AdminLayout>{children}</AdminLayout>
    </Suspense>
  )
}











