/**
 * Page gestion litiges admin
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from "@/lib/shared/db/client"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function AdminDisputesPage() {
  const supabase = createClient()

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['adminDisputes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'disputed' as any)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des litiges</h1>
        <p className="text-muted-foreground">
          Liste des réservations en litige nécessitant une intervention
        </p>
      </div>

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
                      {format(new Date(dispute.created_at), 'PP', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">À traiter</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

