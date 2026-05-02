/**
 * Page gestion litiges admin
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { getAdminDisputes } from '@/lib/core/admin/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { IconLoader2 } from '@tabler/icons-react'
import { PageHeader } from '@/components/ui/page-header'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function AdminDisputesPage() {
  const { data: disputes, isLoading, isError } = useQuery({
    queryKey: ['adminDisputes'],
    retry: 1,
    queryFn: getAdminDisputes,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-sm text-destructive">
        Erreur lors du chargement des litiges. Veuillez recharger la page.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des litiges"
        description="Liste des réservations en litige nécessitant une intervention"
        breadcrumbs={[
          { label: 'Dashboard Admin', href: '/admin/dashboard' },
          { label: 'Litiges' },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Litiges ({disputes?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {disputes?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun litige pour le moment
            </p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes?.map((dispute: any) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-mono text-xs">
                      {dispute.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{dispute.total_price || 0} EUR</TableCell>
                    <TableCell>{dispute.disputed_reason || 'N/A'}</TableCell>
                    <TableCell>
                      {format(new Date(dispute.created_at), 'PP', {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">À traiter</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
