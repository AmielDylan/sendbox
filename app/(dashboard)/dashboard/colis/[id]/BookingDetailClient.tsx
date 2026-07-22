/**
 * Page de détails d'une réservation
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/shared/db/client'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  IconLoader2,
  IconPackage,
  IconCurrencyEuro,
  IconCalendar,
  IconWeight,
  IconLock,
  IconFileText,
  IconQrcode,
  IconCircleCheck,
  IconStar,
  IconArrowLeft,
  IconInfoCircle,
  IconAlertTriangle,
} from '@tabler/icons-react'
import { BookingStatusBadge } from '@/components/features/bookings/BookingStatusBadge'
import { BookingTimeline } from '@/components/features/bookings/BookingTimeline'
import { ParticipantCard } from '@/components/features/bookings/ParticipantCard'
import { PackagePhotosGallery } from '@/components/features/bookings/PackagePhotosGallery'
import { RefuseBookingDialog } from '@/components/features/bookings/RefuseBookingDialog'
import { CancelBookingDialog } from '@/components/features/bookings/CancelBookingDialog'
import { DeleteBookingDialog } from '@/components/features/bookings/DeleteBookingDialog'
import { ConfirmDeliveryDialog } from '@/components/features/bookings/ConfirmDeliveryDialog'
import { BookingReportDialog } from '@/components/features/bookings/BookingReportDialog'
import { DisputeForm } from '@/components/trust/DisputeForm'
import { MatchingFeeGate } from '@/components/trust/MatchingFeeGate'
import { acceptBooking } from '@/lib/core/bookings/requests'
import { getCancellationPolicy } from '@/lib/core/bookings/cancellation-policy'
import { formatBookingReportReason } from '@/lib/core/bookings/report-policy'
import {
  getPublicProfiles,
  mapPublicProfilesById,
} from '@/lib/shared/db/queries/public-profiles'
import type { PublicProfile } from '@/lib/shared/db/queries/public-profiles'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'paid'
  | 'payment_pending'
  | 'deposited'
  | 'in_transit'
  | 'delivered'
  | 'confirmed'
  | 'cancelled'

type MatchingPaymentState = {
  clientSecret: string
  amountCents: number
} | null

export interface BookingDetail {
  id: string
  status: BookingStatus
  kilos_requested: number
  total_price: number | null
  price_per_kg: number | null
  package_description: string | null
  tracking_number: string | null
  package_photos: string[] | null
  insurance_opted: boolean | null
  package_value: number | null
  created_at: string
  paid_at: string | null
  accepted_at: string | null
  refused_at: string | null
  refused_reason: string | null
  cancelled_by: string | null
  cancelled_reason: string | null
  deposited_at: string | null
  delivered_at: string | null
  delivery_confirmed_at: string | null
  sender_id: string
  traveler_id: string
  sender: PublicProfile | null
  traveler: PublicProfile | null
  booking_reports?: Array<{
    id: string
    reason: string
    message: string
    status: string
    suggested_new_date: string | null
    reported_by: string
    created_at: string
  }> | null
  announcement: {
    departure_country: string
    departure_city: string
    arrival_country: string
    arrival_city: string
    departure_date: string
    arrival_date: string | null
  }
}

interface BookingDetailClientProps {
  bookingId: string
  currentUserId: string
  initialBooking: BookingDetail
}

export default function BookingDetailClient({
  bookingId,
  currentUserId,
  initialBooking,
}: BookingDetailClientProps) {
  const router = useRouter()
  const id = bookingId
  const [booking, setBooking] = useState<BookingDetail | null>(initialBooking)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isStartingPayment, setIsStartingPayment] = useState(false)
  const [matchingPayment, setMatchingPayment] =
    useState<MatchingPaymentState>(null)

  async function refreshProfiles(senderId: string, travelerId: string) {
    const supabase = createClient()
    const { data: publicProfiles } = await getPublicProfiles(supabase, [
      senderId,
      travelerId,
    ])
    const profileById = mapPublicProfilesById(publicProfiles || [])

    setBooking(prev => {
      if (!prev) return prev
      return {
        ...prev,
        sender: profileById[senderId] || prev.sender,
        traveler: profileById[travelerId] || prev.traveler,
      }
    })
  }

  const loadBookingDetails = useCallback(async () => {
    try {
      setError(null)
      const supabase = createClient()

      // Récupérer les détails du booking
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(
          `
          *,
          booking_reports (
            id,
            reason,
            message,
            status,
            suggested_new_date,
            reported_by,
            created_at
          ),
          announcement:announcement_id (
            departure_country,
            departure_city,
            arrival_country,
            arrival_city,
            departure_date,
            arrival_date
          )
        `
        )
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('Error loading booking:', fetchError)

        if (fetchError.code === 'PGRST116') {
          // Aucune ligne trouvée
          setError('Réservation introuvable')
          toast.error('Réservation introuvable')
        } else {
          setError(`Erreur: ${fetchError.message}`)
          toast.error('Erreur lors du chargement des détails')
        }

        // Ne pas rediriger immédiatement, afficher l'erreur
        setTimeout(() => router.push('/dashboard/colis'), 2000)
        return
      }

      if (!data) {
        setError('Réservation introuvable')
        toast.error('Réservation introuvable')
        setTimeout(() => router.push('/dashboard/colis'), 2000)
        return
      }

      // Vérifier que l'utilisateur est autorisé
      if (
        data.sender_id !== currentUserId &&
        data.traveler_id !== currentUserId
      ) {
        setError('Accès non autorisé')
        toast.error('Accès non autorisé')
        setTimeout(() => router.push('/dashboard/colis'), 2000)
        return
      }

      const { data: publicProfiles } = await getPublicProfiles(supabase, [
        data.sender_id,
        data.traveler_id,
      ])
      const profileById = mapPublicProfilesById(publicProfiles || [])

      setBooking({
        ...data,
        sender: profileById[data.sender_id] || null,
        traveler: profileById[data.traveler_id] || null,
      } as BookingDetail)
      setError(null)
    } catch (error) {
      console.error('Unexpected error loading booking:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inattendue'
      setError(errorMessage)
      toast.error('Erreur lors du chargement des détails')
      setTimeout(() => router.push('/dashboard/colis'), 2000)
    } finally {
      setIsLoading(false)
    }
  }, [currentUserId, id, router])

  useEffect(() => {
    if (booking) {
      return
    }

    setIsLoading(true)
    loadBookingDetails()
  }, [booking, loadBookingDetails])

  useEffect(() => {
    if (!id) {
      return
    }

    const supabase = createClient()
    const channel = supabase
      .channel(`booking-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${id}`,
        },
        payload => {
          const updated = payload.new as BookingDetail

          setBooking(prev => {
            if (!prev) {
              return prev
            }
            return { ...prev, ...updated }
          })

          void loadBookingDetails()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, loadBookingDetails])

  useEffect(() => {
    if (!id || !currentUserId) {
      return
    }

    const supabase = createClient()
    const suffix =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)

    const channel = supabase
      .channel(`booking-notifications:${id}:${currentUserId}:${suffix}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `booking_id=eq.${id}`,
        },
        payload => {
          const notification = payload.new as { user_id?: string | null }
          if (notification.user_id && notification.user_id !== currentUserId) {
            return
          }
          void loadBookingDetails()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, currentUserId, loadBookingDetails])

  useEffect(() => {
    if (!booking?.sender_id || !booking?.traveler_id) {
      return
    }

    const supabase = createClient()
    const channel = supabase
      .channel(`booking-profiles-${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${booking.sender_id}`,
        },
        () => {
          void refreshProfiles(booking.sender_id, booking.traveler_id)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${booking.traveler_id}`,
        },
        () => {
          void refreshProfiles(booking.sender_id, booking.traveler_id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [booking?.sender_id, booking?.traveler_id, booking?.id])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <div className="text-center">
          <IconPackage className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erreur</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button asChild>
            <Link href="/dashboard/colis">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Retour aux réservations
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <div className="text-center">
          <IconPackage className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Réservation introuvable
          </h2>
          <p className="text-muted-foreground mb-4">
            Cette réservation n'existe pas ou vous n'y avez pas accès
          </p>
          <Button asChild>
            <Link href="/dashboard/colis">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Retour aux réservations
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const isSender = booking.sender_id === currentUserId
  const isTraveler = booking.traveler_id === currentUserId
  const cancellationPolicy = getCancellationPolicy({
    status: booking.status,
    paidAt: booking.paid_at,
    actorRole: isSender ? 'sender' : isTraveler ? 'traveler' : 'unknown',
    cancelledByRole:
      booking.cancelled_by === booking.sender_id
        ? 'sender'
        : booking.cancelled_by === booking.traveler_id
          ? 'traveler'
          : 'unknown',
  })
  const fallbackTotalPrice =
    booking.total_price ?? booking.kilos_requested * (booking.price_per_kg || 0)
  const displayStatus: BookingStatus = booking.delivery_confirmed_at
    ? 'confirmed'
    : booking.status
  const canOpenDispute =
    cancellationPolicy.recommendedAction === 'dispute' ||
    ['paid', 'confirmed', 'deposited', 'in_transit', 'delivered'].includes(
      booking.status
    )
  const openReports = (booking.booking_reports || []).filter(report =>
    ['open', 'reviewing'].includes(report.status)
  )

  const handleAcceptBooking = async () => {
    setIsAccepting(true)
    try {
      const result = await acceptBooking(booking.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Réservation acceptée')
      router.refresh()
    } catch (error) {
      console.error('Error accepting booking:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleStartMatchingPayment = async () => {
    setIsStartingPayment(true)
    try {
      const response = await fetch(`/api/bookings/${booking.id}/confirm`, {
        method: 'POST',
      })
      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Impossible de préparer le paiement')
        return
      }

      if (
        result.status === 'PAYMENT_REQUIRED' ||
        result.status === 'PAYMENT_ALREADY_INITIATED'
      ) {
        if (!result.mustPay) {
          toast.info(
            result.message ||
              "L'expéditeur doit régler les frais de mise en relation"
          )
          return
        }

        toast.info(result.message || 'Paiement de mise en relation requis')
        setMatchingPayment({
          clientSecret: result.clientSecret,
          amountCents: result.amountCents,
        })
        return
      }

      if (result.status === 'WAITING_OTHER_PARTY') {
        toast.success(result.message || 'Votre confirmation est enregistrée')
        await loadBookingDetails()
        return
      }

      toast.success(result.message || 'Mise en relation déjà confirmée')
      await loadBookingDetails()
    } catch (error) {
      console.error('Error starting matching payment:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsStartingPayment(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Détails de la réservation"
        description={
          booking.tracking_number || `Réservation #${booking.id.slice(0, 8)}`
        }
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/colis">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    Résumé de la réservation
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {booking.tracking_number
                      ? `Suivi : ${booking.tracking_number}`
                      : `Réservation #${booking.id.slice(0, 8)}`}
                  </p>
                </div>
                <BookingStatusBadge status={displayStatus} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IconWeight className="h-4 w-4" />
                    <span>Poids</span>
                  </div>
                  <p className="mt-1 font-semibold">
                    {booking.kilos_requested} kg
                  </p>
                </div>

                <div className="rounded border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IconCurrencyEuro className="h-4 w-4" />
                    <span>Prix total</span>
                  </div>
                  <p className="mt-1 font-semibold">
                    {fallbackTotalPrice > 0
                      ? `${fallbackTotalPrice.toFixed(2)}€`
                      : 'Non calculé'}
                  </p>
                </div>

                <div className="rounded border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IconCalendar className="h-4 w-4" />
                    <span>Créée le</span>
                  </div>
                  <p className="mt-1 font-semibold">
                    {format(new Date(booking.created_at), 'dd MMMM yyyy', {
                      locale: fr,
                    })}
                  </p>
                </div>

                {booking.insurance_opted && (
                  <div className="rounded border border-border/60 bg-muted/30 p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IconLock className="h-4 w-4" />
                      <span>Protection du colis</span>
                    </div>
                    <p className="mt-1 font-semibold">
                      Souscrite ({booking.package_value}€)
                    </p>
                  </div>
                )}
              </div>

              {booking.package_description && (
                <div className="rounded border border-border/60 bg-background/60 p-3">
                  <p className="text-sm font-medium">Description du colis</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                    {booking.package_description}
                  </p>
                </div>
              )}

              {booking.refused_reason && (
                <div className="rounded border border-destructive/30 bg-destructive/10 p-3">
                  <p className="text-sm font-medium text-destructive">
                    Raison du refus
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {booking.refused_reason}
                  </p>
                </div>
              )}

              <div className="rounded border border-border/60 bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <IconInfoCircle className="h-4 w-4 text-primary" />
                  <span>Annulation et imprévu V1</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {cancellationPolicy.userNotice}
                </p>
              </div>

              {openReports.length > 0 && (
                <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                    <IconAlertTriangle className="h-4 w-4" />
                    <span>Signalement en cours</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {openReports.map(report => (
                      <div
                        key={report.id}
                        className="text-sm leading-6 text-muted-foreground"
                      >
                        <p className="font-medium text-foreground">
                          {formatBookingReportReason(report.reason)}
                        </p>
                        <p className="line-clamp-2">{report.message}</p>
                        {report.suggested_new_date ? (
                          <p>
                            Nouvelle date proposée :{' '}
                            {format(
                              new Date(report.suggested_new_date),
                              'dd MMMM yyyy',
                              { locale: fr }
                            )}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trajet</CardTitle>
            </CardHeader>
            <CardContent>
              <BookingTimeline
                originCountry={booking.announcement.departure_country}
                originCity={booking.announcement.departure_city}
                destinationCountry={booking.announcement.arrival_country}
                destinationCity={booking.announcement.arrival_city}
                departureDate={booking.announcement.departure_date}
                arrivalDate={booking.announcement.arrival_date || undefined}
              />
            </CardContent>
          </Card>

          {booking.package_photos && booking.package_photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Photos du colis</CardTitle>
              </CardHeader>
              <CardContent>
                <PackagePhotosGallery photos={booking.package_photos} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded border border-border/60 p-4">
                <ParticipantCard
                  role="sender"
                  profile={booking.sender}
                  showContactButton={
                    isTraveler && booking.status !== 'cancelled'
                  }
                  bookingId={booking.id}
                />
              </div>
              <Separator />
              <div className="rounded border border-border/60 p-4">
                <ParticipantCard
                  role="traveler"
                  profile={booking.traveler}
                  showContactButton={isSender && booking.status !== 'cancelled'}
                  bookingId={booking.id}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {matchingPayment && (
                <MatchingFeeGate
                  clientSecret={matchingPayment.clientSecret}
                  amountCents={matchingPayment.amountCents}
                  onSuccess={async () => {
                    toast.success('Paiement accepté. Confirmation en cours...')
                    setMatchingPayment(null)
                    await loadBookingDetails()
                    window.setTimeout(() => {
                      void loadBookingDetails()
                    }, 2500)
                  }}
                />
              )}

              {!matchingPayment && booking.status === 'payment_pending' && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                  <div className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-100">
                    <IconInfoCircle className="h-4 w-4" />
                    <span>Paiement de mise en relation en attente</span>
                  </div>
                  <p className="mt-2 leading-6 text-muted-foreground">
                    {isSender
                      ? 'Le paiement a été préparé. Vous pouvez le reprendre pour finaliser la mise en relation.'
                      : "L'expéditeur doit finaliser les frais Sendbox avant que la mise en relation soit confirmée."}
                  </p>
                  {isSender && (
                    <Button
                      className="mt-3 w-full"
                      onClick={handleStartMatchingPayment}
                      disabled={isStartingPayment}
                    >
                      {isStartingPayment ? (
                        <>
                          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          Préparation...
                        </>
                      ) : (
                        'Reprendre le paiement'
                      )}
                    </Button>
                  )}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {/* Actions Expéditeur */}
                {isSender && booking.status === 'accepted' && (
                  <>
                    <Button
                      className="w-full"
                      onClick={handleStartMatchingPayment}
                      disabled={isStartingPayment}
                    >
                      {isStartingPayment ? (
                        <>
                          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          Préparation...
                        </>
                      ) : (
                        'Payer maintenant'
                      )}
                    </Button>
                    <CancelBookingDialog
                      bookingId={booking.id}
                      description="La réservation est acceptée. Vous pouvez l'annuler en indiquant une raison."
                      policyTitle={cancellationPolicy.title}
                      policyNotice={cancellationPolicy.userNotice}
                    />
                  </>
                )}

                {isSender &&
                  (booking.status === 'confirmed' ||
                    booking.status === 'paid' ||
                    booking.status === 'deposited') && (
                    <>
                      <Button variant="outline" asChild className="w-full">
                        <Link href={`/dashboard/colis/${booking.id}/contrat`}>
                          <IconFileText className="mr-2 h-4 w-4" />
                          Voir le contrat
                        </Link>
                      </Button>
                      <Button variant="outline" asChild className="w-full">
                        <Link href={`/dashboard/colis/${booking.id}/qr`}>
                          <IconQrcode className="mr-2 h-4 w-4" />
                          QR Code
                        </Link>
                      </Button>
                    </>
                  )}

                {isSender &&
                  booking.status === 'delivered' &&
                  !booking.delivery_confirmed_at && (
                    <ConfirmDeliveryDialog bookingId={booking.id} />
                  )}

                {isSender && booking.status === 'delivered' && (
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/dashboard/colis/${booking.id}/noter`}>
                      <IconStar className="mr-2 h-4 w-4" />
                      Noter le voyageur
                    </Link>
                  </Button>
                )}

                {(isSender || isTraveler) &&
                  booking.status !== 'cancelled' &&
                  booking.status !== 'delivered' &&
                  !booking.delivery_confirmed_at && (
                    <BookingReportDialog
                      bookingId={booking.id}
                      onSuccess={() => {
                        void loadBookingDetails()
                      }}
                    />
                  )}

                {(isSender || isTraveler) &&
                  canOpenDispute &&
                  booking.status !== 'cancelled' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <IconAlertTriangle className="mr-2 h-4 w-4" />
                          Ouvrir un litige
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Ouvrir un litige</DialogTitle>
                          <DialogDescription>
                            Le dossier sera transmis à l’admin Sendbox avec les
                            éléments utiles à l’instruction.
                          </DialogDescription>
                        </DialogHeader>
                        <DisputeForm
                          transactionId={booking.id}
                          context={cancellationPolicy.userNotice}
                          onSuccess={() => {
                            toast.success('Litige ouvert')
                            router.refresh()
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  )}

                {/* Actions Voyageur */}
                {isTraveler && booking.status === 'pending' && (
                  <>
                    <Button
                      className="w-full"
                      onClick={handleAcceptBooking}
                      disabled={isAccepting}
                    >
                      {isAccepting ? (
                        <>
                          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          Acceptation...
                        </>
                      ) : (
                        <>
                          <IconCircleCheck className="mr-2 h-4 w-4" />
                          Accepter
                        </>
                      )}
                    </Button>
                    <RefuseBookingDialog bookingId={booking.id} />
                  </>
                )}

                {isTraveler && booking.status === 'accepted' && (
                  <CancelBookingDialog
                    bookingId={booking.id}
                    description="La réservation est acceptée mais pas encore payée. Vous pouvez l'annuler en indiquant une raison."
                    policyTitle={cancellationPolicy.title}
                    policyNotice={cancellationPolicy.userNotice}
                  />
                )}

                {isTraveler &&
                  (booking.status === 'confirmed' ||
                    booking.status === 'paid' ||
                    booking.status === 'deposited') && (
                    <>
                      <Button variant="outline" asChild className="w-full">
                        <Link href={`/dashboard/colis/${booking.id}/contrat`}>
                          <IconFileText className="mr-2 h-4 w-4" />
                          Voir le contrat
                        </Link>
                      </Button>
                      <Button asChild className="w-full">
                        <Link href={`/dashboard/scan/depot/${booking.id}`}>
                          <IconPackage className="mr-2 h-4 w-4" />
                          Scanner QR dépôt
                        </Link>
                      </Button>
                    </>
                  )}

                {isTraveler &&
                  (booking.status === 'confirmed' ||
                    booking.status === 'paid') && (
                    <CancelBookingDialog
                      bookingId={booking.id}
                      description="La mise en relation est confirmée. L'annulation par le voyageur peut entraîner un malus de réputation."
                      penaltyNotice="Un malus sera appliqué à votre réputation."
                      confirmLabel="Annuler la réservation (malus)"
                      policyTitle={cancellationPolicy.title}
                      policyNotice={cancellationPolicy.userNotice}
                    />
                  )}

                {isTraveler && booking.status === 'in_transit' && (
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/scan/livraison/${booking.id}`}>
                      <IconPackage className="mr-2 h-4 w-4" />
                      Confirmer la livraison
                    </Link>
                  </Button>
                )}

                {isTraveler && booking.status === 'delivered' && (
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/dashboard/colis/${booking.id}/noter`}>
                      <IconStar className="mr-2 h-4 w-4" />
                      Noter le client
                    </Link>
                  </Button>
                )}

                {(isSender || isTraveler) && booking.status === 'cancelled' && (
                  <DeleteBookingDialog bookingId={booking.id} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
