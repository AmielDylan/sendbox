/**
 * Layout pour les routes du dashboard
 * (routes protégées nécessitant une authentification)
 */

import { DashboardLayout as DashboardLayoutComponent } from '@/components/layouts/DashboardLayout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutComponent>{children}</DashboardLayoutComponent>
}
