import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { isAdmin } from '@/lib/core/admin/actions'
import { createAdminClient } from '@/lib/shared/db/admin'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconShieldCheck,
} from '@tabler/icons-react'
import { PageHeader } from '@/components/ui/page-header'

export const dynamic = 'force-dynamic'

export default async function AdminKYCPage() {
  if (!(await isAdmin())) redirect('/')

  const admin = createAdminClient()

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, firstname, lastname, email, verification_status, kyc_submitted_at, created_at')
    .order('kyc_submitted_at', { ascending: true })

  const allProfiles = profiles ?? []

  // Charger les kyc_reviews pour savoir si MRZ a été traité
  const userIds = allProfiles.map(p => p.id)
  const reviewMap = new Map<string, { mrz_valid: boolean | null; status: string }>()

  if (userIds.length > 0) {
    const { data: reviews } = await admin
      .from('kyc_reviews')
      .select('user_id, mrz_valid, status')
      .in('user_id', userIds)
      .order('created_at', { ascending: false })

    for (const r of reviews ?? []) {
      if (!reviewMap.has(r.user_id)) {
        reviewMap.set(r.user_id, { mrz_valid: r.mrz_valid, status: r.status })
      }
    }
  }

  const pendingCount = allProfiles.filter(u => u.verification_status === 'pending').length
  const verifiedCount = allProfiles.filter(u => u.verification_status === 'verified').length
  const rejectedCount = allProfiles.filter(u => u.verification_status === 'rejected').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statuts KYC"
        description="Vue d'ensemble des vérifications d'identité"
        breadcrumbs={[
          { label: 'Dashboard Admin', href: '/admin/dashboard' },
          { label: 'KYC' },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vérifiés</CardTitle>
            <IconShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejetés</CardTitle>
            <IconAlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs ({allProfiles.length})</CardTitle>
          <CardDescription>
            Liste des utilisateurs avec leur statut de vérification KYC
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile — cards */}
          <div className="grid gap-3 md:hidden">
            {allProfiles.map(user => {
              const review = reviewMap.get(user.id)
              const kycStatus = user.verification_status
              return (
                <div key={user.id} className="rounded-lg border p-4 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{user.firstname} {user.lastname}</p>
                      <p className="text-xs text-muted-foreground">{user.email || 'N/A'}</p>
                    </div>
                    <Badge
                      variant={
                        kycStatus === 'verified' ? 'default'
                          : kycStatus === 'pending' ? 'secondary'
                          : kycStatus === 'rejected' ? 'destructive'
                          : 'outline'
                      }
                    >
                      {kycStatus === 'verified' ? 'Vérifié'
                        : kycStatus === 'pending' ? 'En attente'
                        : kycStatus === 'rejected' ? 'Rejeté'
                        : 'Non soumis'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>MRZ : {!review ? '-' : review.mrz_valid === null ? 'En attente' : review.mrz_valid ? 'OK' : 'Échec'}</span>
                    <span>{user.kyc_submitted_at ? format(new Date(user.kyc_submitted_at), 'PP', { locale: fr }) : '-'}</span>
                  </div>
                  {kycStatus === 'pending' && (
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link href={`/admin/kyc/${user.id}`}>Vérifier le dossier</Link>
                    </Button>
                  )}
                </div>
              )
            })}
            {allProfiles.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucun utilisateur.</p>
            )}
          </div>

          {/* Desktop — table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Statut KYC</TableHead>
                  <TableHead>MRZ</TableHead>
                  <TableHead>Soumis le</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allProfiles.map(user => {
                  const review = reviewMap.get(user.id)
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.firstname} {user.lastname}
                      </TableCell>
                      <TableCell>{user.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.verification_status === 'verified'
                              ? 'default'
                              : user.verification_status === 'pending'
                                ? 'secondary'
                                : user.verification_status === 'rejected'
                                  ? 'destructive'
                                  : 'outline'
                          }
                        >
                          {user.verification_status === 'verified' && (
                            <IconShieldCheck className="mr-1 h-3 w-3" />
                          )}
                          {user.verification_status === 'pending' && (
                            <IconClock className="mr-1 h-3 w-3" />
                          )}
                          {user.verification_status === 'rejected' && (
                            <IconAlertCircle className="mr-1 h-3 w-3" />
                          )}
                          {user.verification_status === 'verified'
                            ? 'Vérifié'
                            : user.verification_status === 'pending'
                              ? 'En attente'
                              : user.verification_status === 'rejected'
                                ? 'Rejeté'
                                : 'Non soumis'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!review ? (
                          <span className="text-muted-foreground text-xs">-</span>
                        ) : review.mrz_valid === null ? (
                          <IconAlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : review.mrz_valid ? (
                          <IconCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <IconAlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell>
                        {user.kyc_submitted_at
                          ? format(new Date(user.kyc_submitted_at), 'PP', { locale: fr })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {user.verification_status === 'pending' && (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/kyc/${user.id}`}>Vérifier</Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
