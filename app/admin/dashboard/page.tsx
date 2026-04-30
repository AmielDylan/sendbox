/**
 * Dashboard admin - Vue d'ensemble
 */

import { Suspense } from 'react'
import { isAdmin, getAdminStats } from '@/lib/core/admin/actions'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AdminChartsSection } from '@/components/features/admin/AdminChartsSection'
import Link from 'next/link'
import {
  IconUsers,
  IconFileCheck,
  IconPackage,
  IconCurrencyEuro,
  IconAlertTriangle,
  IconLoader2,
  IconUserPlus,
} from '@tabler/icons-react'

async function DashboardContent() {
  const admin = await isAdmin()

  if (!admin) {
    redirect('/')
  }

  const stats = await getAdminStats()

  if ('error' in stats) {
    return <div>Erreur: {stats.error}</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Admin"
        description="Vue d'ensemble de la plateforme Sendbox"
        breadcrumbs={[{ label: 'Dashboard Admin' }]}
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilisateurs inscrits
            </CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nouveaux ce mois
            </CardTitle>
            <IconUserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newUsersThisMonth}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC en attente</CardTitle>
            <IconFileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingKYC}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Réservations actives
            </CardTitle>
            <IconPackage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Litiges actifs
            </CardTitle>
            <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDisputes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Volume ce mois
            </CardTitle>
            <IconCurrencyEuro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.monthlyRevenue.toFixed(2)} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Commission plateforme
            </CardTitle>
            <IconCurrencyEuro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.platformCommission.toFixed(2)} €
            </div>
            <p className="text-xs text-muted-foreground mt-1">3 % du volume</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes dynamiques */}
      {stats.activeDisputes > 0 ? (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">{stats.activeDisputes} litige{stats.activeDisputes > 1 ? 's' : ''} actif{stats.activeDisputes > 1 ? 's' : ''}</span>
            {' '}nécessite{stats.activeDisputes > 1 ? 'nt' : ''} votre attention.{' '}
            <Link href="/admin/disputes" className="underline underline-offset-2">
              Voir les litiges
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <IconAlertTriangle className="h-4 w-4" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aucune alerte urgente pour le moment
            </p>
          </CardContent>
        </Card>
      )}

      {/* Graphiques */}
      <AdminChartsSection
        weeklyRegistrations={stats.weeklyRegistrations}
        dailyTransactions={stats.dailyTransactions}
      />
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
