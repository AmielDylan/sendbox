/**
 * Page admin pour voir les statuts KYC
 * Note: La vérification KYC est gérée automatiquement par Stripe Identity
 */

'use client'

import { useQuery } from '@tanstack/react-query'
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
import {
  IconLoader2,
  IconShieldCheck,
  IconClock,
  IconAlertCircle,
  IconInfoCircle,
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function AdminKYCPage() {
  const { data: kycStats, isLoading } = useQuery({
    queryKey: ['adminKYCStats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Erreur de chargement')
      }

      const payload = await res.json()
      const users = (payload?.data || []) as any[]

      return users.sort((a, b) => {
        const aTime = a.kyc_submitted_at
          ? new Date(a.kyc_submitted_at).getTime()
          : 0
        const bTime = b.kyc_submitted_at
          ? new Date(b.kyc_submitted_at).getTime()
          : 0
        return bTime - aTime
      })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const pendingCount =
    kycStats?.filter(u => u.kyc_status === 'pending').length || 0
  const approvedCount =
    kycStats?.filter(u => u.kyc_status === 'approved').length || 0
  const rejectedCount =
    kycStats?.filter(u => u.kyc_status === 'rejected').length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Statuts KYC</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble des vérifications d'identité
        </p>
      </div>

      {/* Message info Stripe Identity */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <IconInfoCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Vérification automatique par Stripe Identity
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Les vérifications d'identité sont gérées automatiquement par
                Stripe Identity. Les utilisateurs soumettent leurs documents via
                un flux sécurisé et les résultats sont automatiquement
                synchronisés. Aucune action manuelle n'est requise.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
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
            <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
            <IconShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
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

      {/* Liste des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs ({kycStats?.length || 0})</CardTitle>
          <CardDescription>
            Liste des utilisateurs avec leur statut de vérification KYC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Statut KYC</TableHead>
                <TableHead>Soumis le</TableHead>
                <TableHead>Inscrit le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kycStats?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.firstname} {user.lastname}
                  </TableCell>
                  <TableCell>{user.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.kyc_status === 'approved'
                          ? 'default'
                          : user.kyc_status === 'pending'
                            ? 'secondary'
                            : user.kyc_status === 'rejected'
                              ? 'destructive'
                              : 'outline'
                      }
                    >
                      {user.kyc_status === 'approved' && (
                        <IconShieldCheck className="mr-1 h-3 w-3" />
                      )}
                      {user.kyc_status === 'pending' && (
                        <IconClock className="mr-1 h-3 w-3" />
                      )}
                      {user.kyc_status === 'rejected' && (
                        <IconAlertCircle className="mr-1 h-3 w-3" />
                      )}
                      {user.kyc_status || 'Non soumis'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.kyc_submitted_at
                      ? format(new Date(user.kyc_submitted_at), 'PP', {
                          locale: fr,
                        })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'PP', { locale: fr })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
