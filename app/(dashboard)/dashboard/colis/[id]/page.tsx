/**
 * Page de détails d'une réservation
 */

'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from "@/lib/shared/db/client"
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  IconLoader2,
  IconPackage,
  IconCurrencyEuro,
  IconCalendar,
  IconWeight,
  IconShield,
  IconFileText,
  IconQrcode,
  IconCreditCard,
  IconCircleCheck,
  IconStar,
  IconArrowLeft,
} from '@tabler/icons-react'
import { BookingStatusBadge } from '@/components/features/bookings/BookingStatusBadge'
import { BookingTimeline } from '@/components/features/bookings/BookingTimeline'
import { ParticipantCard } from '@/components/features/bookings/ParticipantCard'
import { PackagePhotosGallery } from '@/components/features/bookings/PackagePhotosGallery'
import { RefuseBookingDialog } from '@/components/features/bookings/RefuseBookingDialog'
import { CancelBookingDialog } from '@/components/features/bookings/CancelBookingDialog'
import { DeleteBookingDialog } from '@/components/features/bookings/DeleteBookingDialog'
import { acceptBooking } from "@/lib/core/bookings/requests"
import {
  getPublicProfiles,
  mapPublicProfilesById,
} from "@/lib/shared/db/queries/public-profiles"
import type { PublicProfile } from "@/lib/shared/db/queries/public-profiles"
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type BookingStatus = 'pending' | 'accepted' | 'paid' | 'deposited' | 'in_transit' | 'delivered' | 'cancelled'

interface BookingDetail {
  id: string
  status: BookingStatus
  kilos_requested: number
  total_price: number | null
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
  deposited_at: string | null
  delivered_at: string | null
  sender_id: string
  traveler_id: string
  sender: PublicProfile | null
  traveler: PublicProfile | null
  announcement: {
    departure_country: string
    departure_city: string
    arrival_country: string
    arrival_city: string
    departure_date: string
    arrival_date: string | null
  }
}

interface BookingDetailPageProps {
  params: Promise<{ id: string }>
}

export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)

  useEffect(() => {
    loadBookingDetails()
  }, [id])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('payment') === 'success' && !isCheckingPayment) {
      handlePaymentSuccess()
    }
  }, [id, isCheckingPayment])

  const loadBookingDetails = async () => {
    try {
      setError(null)
      const supabase = createClient()

      // Récupérer l'utilisateur actuel
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setError('Vous devez être connecté')
        toast.error('Vous devez être connecté')
        router.push('/login')
        return
      }
      setCurrentUserId(user.id)

      // Récupérer les détails du booking
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          announcement:announcement_id (
            departure_country,
            departure_city,
            arrival_country,
            arrival_city,
            departure_date,
            arrival_date
          )
        `)
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
      if (data.sender_id !== user.id && data.traveler_id !== user.id) {
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
      const errorMessage = error instanceof Error ? error.message : 'Erreur inattendue'
      setError(errorMessage)
      toast.error('Erreur lors du chargement des détails')
      setTimeout(() => router.push('/dashboard/colis'), 2000)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = async () => {
    setIsCheckingPayment(true)
    toast.info('Vérification du paiement en cours...')

    let attempts = 0
    const maxAttempts = 5
    const pollInterval = 2000 // 2 secondes

    const checkPayment = async (): Promise<void> => {
      attempts++

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('bookings')
          .select('status, paid_at')
          .eq('id', id)
          .single()

        if (error) throw error

        if (data.status === 'paid' || data.paid_at) {
          // Paiement confirmé
          toast.success('Paiement confirmé ! Vous pouvez maintenant accéder au contrat et au QR code.')
          setIsCheckingPayment(false)

          // Nettoyer l'URL
          window.history.replaceState({}, '', `/dashboard/colis/${id}`)

          // Recharger les détails complets
          await loadBookingDetails()
          return
        }

        if (attempts < maxAttempts) {
          // Continuer le polling
          setTimeout(() => checkPayment(), pollInterval)
        } else {
          // Timeout atteint
          toast.warning(
            'Le paiement est en cours de traitement. Veuillez actualiser la page dans quelques instants.',
            { duration: 5000 }
          )
          setIsCheckingPayment(false)
          window.history.replaceState({}, '', `/dashboard/colis/${id}`)
        }
      } catch (error) {
        console.error('Error checking payment:', error)
        toast.error('Erreur lors de la vérification du paiement')
        setIsCheckingPayment(false)
        window.history.replaceState({}, '', `/dashboard/colis/${id}`)
      }
    }

    // Lancer le polling
    await checkPayment()
  }

  if (isLoading || isCheckingPayment) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        {isCheckingPayment && (
          <p className="text-sm text-muted-foreground">Vérification du paiement en cours...</p>
        )}
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

  if (!booking || !currentUserId) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <div className="text-center">
          <IconPackage className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Réservation introuvable</h2>
          <p className="text-muted-foreground mb-4">Cette réservation n'existe pas ou vous n'y avez pas accès</p>
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Détails de la réservation"
        description={booking.tracking_number || `Réservation #${booking.id.slice(0, 8)}`}
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
                  <CardTitle className="text-lg">Résumé de la réservation</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {booking.tracking_number
                      ? `Suivi : ${booking.tracking_number}`
                      : `Réservation #${booking.id.slice(0, 8)}`}
                  </p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IconWeight className="h-4 w-4" />
                    <span>Poids</span>
                  </div>
                  <p className="mt-1 font-semibold">{booking.kilos_requested} kg</p>
                </div>

                <div className="rounded border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IconCurrencyEuro className="h-4 w-4" />
                    <span>Prix total</span>
                  </div>
                  <p className="mt-1 font-semibold">
                    {booking.total_price ? `${booking.total_price}€` : 'Non calculé'}
                  </p>
                </div>

                <div className="rounded border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IconCalendar className="h-4 w-4" />
                    <span>Créée le</span>
                  </div>
                  <p className="mt-1 font-semibold">
                    {format(new Date(booking.created_at), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>

                {booking.insurance_opted && (
                  <div className="rounded border border-border/60 bg-muted/30 p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IconShield className="h-4 w-4" />
                      <span>Assurance</span>
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
                  <p className="mt-1 text-sm text-muted-foreground">{booking.package_description}</p>
                </div>
              )}

              {booking.refused_reason && (
                <div className="rounded border border-destructive/30 bg-destructive/10 p-3">
                  <p className="text-sm font-medium text-destructive">Raison du refus</p>
                  <p className="mt-1 text-sm text-muted-foreground">{booking.refused_reason}</p>
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
                  showContactButton={isTraveler && booking.status !== 'cancelled'}
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
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {/* Actions Expéditeur */}
                {isSender && booking.status === 'accepted' && (
                  <>
                    <Button asChild className="w-full">
                      <Link href={`/dashboard/colis/${booking.id}/paiement`}>
                        <IconCreditCard className="mr-2 h-4 w-4" />
                        Payer maintenant
                      </Link>
                    </Button>
                    <CancelBookingDialog bookingId={booking.id} />
                  </>
                )}

                {isSender && (booking.status === 'paid' || booking.status === 'deposited') && (
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

                {isSender && booking.status === 'delivered' && (
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/colis/${booking.id}/noter`}>
                      <IconStar className="mr-2 h-4 w-4" />
                      Noter le voyageur
                    </Link>
                  </Button>
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

                {isTraveler && (booking.status === 'paid' || booking.status === 'deposited') && (
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

                {isTraveler && booking.status === 'in_transit' && (
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/scan/livraison/${booking.id}`}>
                      <IconPackage className="mr-2 h-4 w-4" />
                      Scanner QR livraison
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
