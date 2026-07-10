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
import { IconLoader2, IconExternalLink } from '@tabler/icons-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

export default function AdminDisputesPage() {
  const {
    data: disputes,
    isLoading,
    isError,
  } = useQuery({
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
                    <TableHead>Litige</TableHead>
                    <TableHead>Réservation</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes?.map((dispute: any) => {
                    const booking = Array.isArray(dispute.bookings)
                      ? dispute.bookings[0]
                      : dispute.bookings

                    return (
                      <TableRow key={dispute.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-mono text-xs">
                              {dispute.id.slice(0, 8)}...
                            </p>
                            <Badge variant="destructive">
                              {dispute.status || 'OPEN'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <p className="font-mono text-xs">
                              {dispute.booking_id?.slice(0, 8)}...
                            </p>
                            <p className="text-muted-foreground">
                              {booking?.total_price || 0} EUR
                              {booking?.kilos_requested
                                ? ` · ${booking.kilos_requested} kg`
                                : ''}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[180px]">
                          <p className="text-sm font-medium">
                            {dispute.reason || 'N/A'}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Ouvert par {dispute.opened_by_id?.slice(0, 8)}...
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[340px]">
                          <p className="line-clamp-5 whitespace-pre-line text-sm text-muted-foreground">
                            {dispute.description || 'Aucune description'}
                          </p>
                        </TableCell>
                        <TableCell>
                          {format(new Date(dispute.created_at), 'PP', {
                            locale: fr,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Badge variant="destructive">À traiter</Badge>
                            {dispute.booking_id ? (
                              <Button asChild variant="outline" size="sm">
                                <Link
                                  href={`/dashboard/colis/${dispute.booking_id}`}
                                >
                                  <IconExternalLink className="mr-2 h-4 w-4" />
                                  Dossier
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
