/**
 * Layout pour les routes du dashboard
 * (routes protégées nécessitant une authentification)
 */

import { DashboardLayout as DashboardLayoutComponent } from '@/components/layouts/DashboardLayout'

// Force dynamic rendering for all dashboard pages (require auth)
export const dynamic = 'force-dynamic'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutComponent>{children}</DashboardLayoutComponent>
}
