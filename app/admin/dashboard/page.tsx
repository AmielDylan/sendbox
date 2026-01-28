/**
 * Dashboard admin - Vue d'ensemble
 */

import { Suspense } from 'react'
import { isAdmin, getAdminStats } from '@/lib/core/admin/actions'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  IconUsers,
  IconFileCheck,
  IconPackage,
  IconCurrencyEuro,
  IconAlertTriangle,
  IconLoader2,
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
      <div>
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de la plateforme Sendbox
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              KYC en attente
            </CardTitle>
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
            <CardTitle className="text-sm font-medium">CA ce mois</CardTitle>
            <IconCurrencyEuro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.monthlyRevenue.toFixed(2)} EUR
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconAlertTriangle className="h-5 w-5" />
            Alertes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Aucune alerte urgente pour le moment
            </p>
            {/* TODO: Implémenter les alertes (litiges, KYC expirés, etc.) */}
          </div>
        </CardContent>
      </Card>

      {/* Graphiques */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inscriptions par semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Graphique à implémenter
            </p>
            {/* TODO: Implémenter graphique avec recharts ou similar */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume transactions par jour</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Graphique à implémenter
            </p>
            {/* TODO: Implémenter graphique */}
          </CardContent>
        </Card>
      </div>
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
