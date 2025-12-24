/**
 * Page gestion réservations admin
 */

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from "@/lib/shared/db/client"
import { forceRefund, releasePayment, markAsDispute } from "@/lib/core/admin/actions"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, DollarSign, Unlock, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function AdminBookingsPage() {
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false)
  const [reason, setReason] = useState('')

  const supabase = createClient()

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data
    },
  })

  const handleRefund = async () => {
    if (!selectedBooking) return

    const result = await forceRefund(selectedBooking.id, reason)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Remboursement effectué')
    setRefundDialogOpen(false)
    setReason('')
    refetch()
  }

  const handleReleasePayment = async (bookingId: string) => {
    const result = await releasePayment(bookingId)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Paiement débloqué')
    refetch()
  }

  const handleDispute = async () => {
    if (!selectedBooking) return

    const result = await markAsDispute(selectedBooking.id, reason)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Réservation marquée comme litige')
    setDisputeDialogOpen(false)
    setReason('')
    refetch()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'secondary',
      confirmed: 'default',
      in_transit: 'default',
      delivered: 'default',
      cancelled: 'destructive',
      disputed: 'destructive',
    }
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des réservations</h1>
        <p className="text-muted-foreground">
          Liste et gestion de toutes les réservations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Réservations ({bookings?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Poids</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings?.map((booking: any) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono text-xs">
                    {booking.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell>{booking.weight_kg} kg</TableCell>
                  <TableCell>{booking.total_price || 0} EUR</TableCell>
                  <TableCell>
                    {format(new Date(booking.created_at), 'PP', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReleasePayment(booking.id)}
                        disabled={booking.status !== 'delivered'}
                      >
                        <Unlock className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBooking(booking)
                          setRefundDialogOpen(true)
                        }}
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedBooking(booking)
                          setDisputeDialogOpen(true)
                        }}
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Remboursement */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forcer remboursement</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir rembourser cette réservation ?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="refund-reason">Raison</Label>
              <Textarea
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Raison du remboursement..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleRefund}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Litige */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme litige</DialogTitle>
            <DialogDescription>
              Marquer cette réservation comme litige
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dispute-reason">Raison du litige</Label>
              <Textarea
                id="dispute-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Raison du litige..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDispute}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}









