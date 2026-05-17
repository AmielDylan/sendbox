import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/core/admin/actions'
import { createAdminClient } from '@/lib/shared/db/admin'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const adminUser = await isAdmin()

  if (!adminUser) {
    redirect('/')
  }

  const data = await getDashboardData()
  const ratio = getRatio(data.activeSenders30d, data.activeTravelers30d)
  const ratioText = formatRatio(ratio)
  const ratioInterpretation = getRatioInterpretation(ratio)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard admin"
        description="Métriques opérationnelles et files à traiter"
        breadcrumbs={[{ label: 'Dashboard admin' }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Senders actifs (30j)"
          value={data.activeSenders30d.toString()}
        />
        <MetricCard
          title="Travelers actifs (30j)"
          value={data.activeTravelers30d.toString()}
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Ratio S/T</CardTitle>
            <Badge
              variant={
                ratio > 3 ? 'destructive' : ratio < 2 ? 'default' : 'secondary'
              }
            >
              {ratioText}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ratioText}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              {ratioInterpretation}
            </p>
          </CardContent>
        </Card>
        <MetricCard
          title="Transactions ce mois"
          value={data.transactionsThisMonth.toString()}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Frais encaissés ce mois"
          value={`${data.matchingFeesThisMonth.toFixed(2).replace('.', ',')} €`}
        />
        <MetricCard
          title="KYC en attente"
          value={data.pendingKycCount.toString()}
          href="/admin/kyc"
          action="Voir la liste"
        />
        <MetricCard
          title="Litiges ouverts"
          value={data.openDisputesCount.toString()}
          href="/admin/disputes"
          action="Voir la liste"
        />
      </div>

      <DashboardTable title="Litiges ouverts">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead>Raison</TableHead>
              <TableHead className="hidden sm:table-cell">Plaignant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.openDisputes.map(dispute => (
              <TableRow key={dispute.id}>
                <TableCell className="hidden sm:table-cell">
                  {formatDate(dispute.opened_at)}
                </TableCell>
                <TableCell>{dispute.reason || 'Non renseignée'}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {dispute.openedByName}
                </TableCell>
                <TableCell>
                  <Badge variant="destructive">{dispute.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/disputes/${dispute.id}`}>
                      Instruire
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {data.openDisputes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Aucun litige ouvert.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </DashboardTable>

      <DashboardTable title="KYC en attente">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.pendingKyc.map(profile => (
              <TableRow key={profile.id}>
                <TableCell>{profile.name}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {profile.email}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {formatDate(profile.created_at)}
                </TableCell>
                <TableCell>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/kyc/${profile.id}`}>Vérifier</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {data.pendingKyc.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Aucun KYC en attente.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </DashboardTable>

      <DashboardTable title="Dernières transactions">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead>Corridor</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="hidden sm:table-cell">Flaggé ?</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.latestTransactions.map(transaction => (
              <TableRow
                key={transaction.id}
                className={cn(transaction.is_flagged && 'bg-destructive/10')}
              >
                <TableCell className="hidden sm:table-cell">
                  {formatDate(transaction.created_at)}
                </TableCell>
                <TableCell>{transaction.corridor}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{transaction.status}</Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {transaction.is_flagged ? 'Oui' : 'Non'}
                </TableCell>
              </TableRow>
            ))}
            {data.latestTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Aucune transaction récente.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </DashboardTable>
    </div>
  )
}

function MetricCard({
  title,
  value,
  href,
  action,
}: {
  title: string
  value: string
  href?: string
  action?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {href && action ? (
          <Button asChild variant="link" className="mt-2 h-auto p-0">
            <Link href={href}>{action}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

function DashboardTable({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">{children}</CardContent>
    </Card>
  )
}

async function getDashboardData() {
  const admin = createAdminClient()
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    bookings30d,
    announcements30d,
    transactionsCount,
    matchingPayments,
    pendingKycCount,
    openDisputesCount,
    openDisputes,
    pendingKyc,
    latestBookings,
  ] = await Promise.all([
    admin
      .from('bookings')
      .select('sender_id')
      .gte('created_at', thirtyDaysAgo.toISOString()),
    admin
      .from('announcements')
      .select('traveler_id')
      .gte('created_at', thirtyDaysAgo.toISOString()),
    admin
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString()),
    admin
      .from('matching_payments')
      .select('amount_cents')
      .eq('status', 'succeeded')
      .gte('created_at', startOfMonth.toISOString()),
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .or('kyc_status.eq.pending,verification_status.eq.pending'),
    admin
      .from('disputes')
      .select('id', { count: 'exact', head: true })
      .in('status', ['OPEN', 'UNDER_REVIEW', 'open', 'under_review']),
    admin
      .from('disputes')
      .select('id, booking_id, opened_at, reason, status, opened_by_id')
      .in('status', ['OPEN', 'UNDER_REVIEW', 'open', 'under_review'])
      .order('opened_at', { ascending: false })
      .limit(10),
    admin
      .from('profiles')
      .select('id, created_at, firstname, lastname, email')
      .or('kyc_status.eq.pending,verification_status.eq.pending')
      .order('created_at', { ascending: true })
      .limit(10),
    admin
      .from('bookings')
      .select(
        'id, created_at, status, is_flagged, announcements:announcement_id(origin_city, destination_city, departure_city, arrival_city)'
      )
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const openedByIds = [
    ...new Set(
      (openDisputes.data ?? [])
        .map(dispute => dispute.opened_by_id)
        .filter((id): id is string => Boolean(id))
    ),
  ]

  const { data: complainants } =
    openedByIds.length > 0
      ? await admin
          .from('profiles')
          .select('id, firstname, lastname, email')
          .in('id', openedByIds)
      : { data: [] }

  const complainantMap = new Map(
    (complainants ?? []).map(profile => [
      profile.id,
      formatProfileName(profile.firstname, profile.lastname, profile.email),
    ])
  )

  return {
    activeSenders30d: new Set(
      (bookings30d.data ?? []).map(row => row.sender_id).filter(Boolean)
    ).size,
    activeTravelers30d: new Set(
      (announcements30d.data ?? []).map(row => row.traveler_id).filter(Boolean)
    ).size,
    transactionsThisMonth: transactionsCount.count ?? 0,
    matchingFeesThisMonth:
      (matchingPayments.data ?? []).reduce(
        (sum, payment) => sum + payment.amount_cents,
        0
      ) / 100,
    pendingKycCount: pendingKycCount.count ?? 0,
    openDisputesCount: openDisputesCount.count ?? 0,
    openDisputes: (openDisputes.data ?? []).map(dispute => ({
      ...dispute,
      openedByName: dispute.opened_by_id
        ? complainantMap.get(dispute.opened_by_id) || 'Utilisateur inconnu'
        : 'Utilisateur inconnu',
    })),
    pendingKyc: (pendingKyc.data ?? []).map(profile => ({
      id: profile.id,
      created_at: profile.created_at,
      email: profile.email,
      name: formatProfileName(
        profile.firstname,
        profile.lastname,
        profile.email
      ),
    })),
    latestTransactions: (latestBookings.data ?? []).map(booking => {
      const announcement = Array.isArray((booking as any).announcements)
        ? (booking as any).announcements[0]
        : (booking as any).announcements

      return {
        id: booking.id,
        created_at: booking.created_at,
        status: booking.status,
        is_flagged: Boolean(booking.is_flagged),
        corridor: formatCorridor(announcement),
      }
    }),
  }
}

function getRatio(senders: number, travelers: number) {
  if (travelers === 0) {
    return senders > 0 ? Number.POSITIVE_INFINITY : 0
  }

  return Math.round((senders / travelers) * 10) / 10
}

function formatRatio(ratio: number) {
  if (!Number.isFinite(ratio)) {
    return '∞'
  }

  return ratio.toFixed(1).replace('.', ',')
}

function getRatioInterpretation(ratio: number) {
  if (ratio > 3) {
    return "Trop de senders en attente : renforcer l'acquisition travelers"
  }

  if (ratio < 1) {
    return 'Trop de travelers sans demande : relancer les senders'
  }

  return 'Équilibre correct'
}

function formatDate(value: string | null) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function truncateId(value: string) {
  return `${value.slice(0, 8)}...`
}

function formatProfileName(
  firstname: string | null,
  lastname: string | null,
  email: string
) {
  const name = [firstname, lastname].filter(Boolean).join(' ').trim()

  return name || email
}

function formatCorridor(announcement: any) {
  const origin =
    announcement?.origin_city || announcement?.departure_city || 'Départ'
  const destination =
    announcement?.destination_city || announcement?.arrival_city || 'Arrivée'

  return `${origin} → ${destination}`
}
