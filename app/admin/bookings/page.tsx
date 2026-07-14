/**
 * Page gestion réservations admin
 */

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  forceRefund,
  releasePayment,
  markAsDispute,
  updateBookingReportStatus,
  getAdminBookings,
} from '@/lib/core/admin/actions'
import { getCancellationPolicy } from '@/lib/core/bookings/cancellation-policy'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  IconLoader2,
  IconCurrencyDollar,
  IconLockOpen,
  IconAlertTriangle,
  IconDotsVertical,
} from '@tabler/icons-react'
import { formatBookingReportReason } from '@/lib/core/bookings/report-policy'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function AdminBookingsPage() {
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [reportTargetStatus, setReportTargetStatus] = useState<
    'reviewing' | 'resolved' | 'dismissed'
  >('reviewing')
  const [reason, setReason] = useState('')
  const [reportAdminNote, setReportAdminNote] = useState('')

  const {
    data: bookings,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['adminBookings'],
    retry: 1,
    queryFn: getAdminBookings,
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

  const handleReportStatus = async () => {
    if (!selectedReport) return

    const result = await updateBookingReportStatus(
      selectedReport.id,
      reportTargetStatus,
      reportAdminNote
    )

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Signalement mis a jour')
    setReportDialogOpen(false)
    setSelectedReport(null)
    setReportAdminNote('')
    refetch()
  }

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
        Erreur lors du chargement des réservations. Veuillez recharger la page.
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

  const getCancelledByRole = (booking: any) => {
    if (booking.cancelled_by === booking.sender_id) return 'sender'
    if (booking.cancelled_by === booking.traveler_id) return 'traveler'
    return 'unknown'
  }

  const getOpenReports = (booking: any) =>
    (booking.booking_reports || []).filter((report: any) =>
      ['open', 'reviewing'].includes(report.status)
    )

  const openReportDialog = (
    report: any,
    status: 'reviewing' | 'resolved' | 'dismissed'
  ) => {
    setSelectedReport(report)
    setReportTargetStatus(status)
    setReportAdminNote(report.admin_note || '')
    setReportDialogOpen(true)
  }

  const renderReportActions = (report: any) => (
    <div className="flex flex-wrap gap-2">
      {report.status === 'open' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openReportDialog(report, 'reviewing')}
        >
          Examiner
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => openReportDialog(report, 'resolved')}
      >
        Résoudre
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openReportDialog(report, 'dismissed')}
      >
        Classer
      </Button>
    </div>
  )

  const renderActionsMenu = (booking: any) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <IconDotsVertical className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={booking.status !== 'delivered'}
          onClick={() => handleReleasePayment(booking.id)}
        >
          <IconLockOpen className="h-4 w-4" />
          Debloquer le paiement
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setSelectedBooking(booking)
            setRefundDialogOpen(true)
          }}
        >
          <IconCurrencyDollar className="h-4 w-4" />
          Forcer remboursement
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => {
            setSelectedBooking(booking)
            setDisputeDialogOpen(true)
          }}
        >
          <IconAlertTriangle className="h-4 w-4" />
          Marquer comme litige
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des réservations"
        description="Liste et gestion de toutes les réservations"
        breadcrumbs={[
          { label: 'Dashboard Admin', href: '/admin/dashboard' },
          { label: 'Réservations' },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Réservations ({bookings?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:hidden">
            {bookings?.map((booking: any) => {
              const openReports = getOpenReports(booking)
              const cancellationPolicy = getCancellationPolicy({
                status: booking.status,
                paidAt: booking.paid_at,
                actorRole: 'admin',
                cancelledByRole: getCancelledByRole(booking),
              })

              return (
                <div
                  key={booking.id}
                  className="space-y-4 rounded-lg border p-4 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="font-mono text-xs text-muted-foreground">
                        {booking.id.slice(0, 8)}...
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(booking.status)}
                        {openReports.length > 0 && (
                          <Badge variant="destructive">
                            Signalement ouvert
                          </Badge>
                        )}
                        <Badge
                          variant={
                            cancellationPolicy.requiresAdminReview
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {cancellationPolicy.adminLabel}
                        </Badge>
                      </div>
                    </div>
                    {renderActionsMenu(booking)}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="text-muted-foreground">Poids</p>
                      <p className="mt-1 font-medium">{booking.weight_kg} kg</p>
                    </div>
                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="text-muted-foreground">Montant</p>
                      <p className="mt-1 font-medium">
                        {booking.total_price || 0} EUR
                      </p>
                    </div>
                    <div className="col-span-2 rounded-md bg-muted/40 p-3">
                      <p className="text-muted-foreground">Date</p>
                      <p className="mt-1 font-medium">
                        {format(new Date(booking.created_at), 'PP', {
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs leading-5 text-muted-foreground">
                    {cancellationPolicy.adminDescription}
                  </p>

                  {openReports.length > 0 && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
                      <p className="text-xs font-medium text-destructive">
                        Dernier signalement
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {formatBookingReportReason(openReports[0].reason)}
                      </p>
                      <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">
                        {openReports[0].message}
                      </p>
                      <div className="mt-3">
                        {renderReportActions(openReports[0])}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Poids</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Traitement V1</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings?.map((booking: any) => {
                  const openReports = getOpenReports(booking)
                  const cancellationPolicy = getCancellationPolicy({
                    status: booking.status,
                    paidAt: booking.paid_at,
                    actorRole: 'admin',
                    cancelledByRole: getCancelledByRole(booking),
                  })

                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-xs">
                        {booking.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>{booking.weight_kg} kg</TableCell>
                      <TableCell>{booking.total_price || 0} EUR</TableCell>
                      <TableCell className="max-w-[220px]">
                        <div className="space-y-1">
                          <Badge
                            variant={
                              cancellationPolicy.requiresAdminReview
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {cancellationPolicy.adminLabel}
                          </Badge>
                          {openReports.length > 0 && (
                            <Badge variant="destructive">
                              Signalement ouvert
                            </Badge>
                          )}
                          <p className="text-xs leading-5 text-muted-foreground">
                            {cancellationPolicy.adminDescription}
                          </p>
                          {openReports.length > 0 && (
                            <p className="text-xs leading-5 text-destructive">
                              {formatBookingReportReason(openReports[0].reason)}
                            </p>
                          )}
                          {openReports.length > 0 && (
                            <div className="pt-1">
                              {renderReportActions(openReports[0])}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.created_at), 'PP', {
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 lg:hidden">
                          {renderActionsMenu(booking)}
                        </div>
                        <div className="hidden gap-2 lg:flex">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReleasePayment(booking.id)}
                            disabled={booking.status !== 'delivered'}
                          >
                            <IconLockOpen className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking)
                              setRefundDialogOpen(true)
                            }}
                          >
                            <IconCurrencyDollar className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking)
                              setDisputeDialogOpen(true)
                            }}
                          >
                            <IconAlertTriangle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
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
                onChange={e => setReason(e.target.value)}
                placeholder="Raison du remboursement..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundDialogOpen(false)}
            >
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
                onChange={e => setReason(e.target.value)}
                placeholder="Raison du litige..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisputeDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDispute}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reportTargetStatus === 'reviewing'
                ? 'Passer le signalement en examen'
                : reportTargetStatus === 'resolved'
                  ? 'Résoudre le signalement'
                  : 'Classer le signalement'}
            </DialogTitle>
            <DialogDescription>
              {selectedReport
                ? formatBookingReportReason(selectedReport.reason)
                : 'Signalement réservation'}
            </DialogDescription>
          </DialogHeader>
          {selectedReport ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              <p className="whitespace-pre-line">{selectedReport.message}</p>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="report-admin-note">
              Note admin
              {reportTargetStatus !== 'reviewing' ? ' obligatoire' : ''}
            </Label>
            <Textarea
              id="report-admin-note"
              value={reportAdminNote}
              onChange={e => setReportAdminNote(e.target.value)}
              placeholder="Synthèse, décision ou prochaine action..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReportDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant={
                reportTargetStatus === 'dismissed' ? 'secondary' : 'default'
              }
              onClick={handleReportStatus}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
