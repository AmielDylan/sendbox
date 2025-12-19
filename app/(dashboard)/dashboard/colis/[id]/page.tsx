/**
 * Page de détails d'une réservation
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Loader2,
  Package,
  Euro,
  Calendar,
  Weight,
  Shield,
  FileText,
  QrCode,
  CreditCard,
  CheckCircle2,
  Star,
  ArrowLeft,
} from 'lucide-react'
import { BookingStatusBadge } from '@/components/features/bookings/BookingStatusBadge'
import { BookingTimeline } from '@/components/features/bookings/BookingTimeline'
import { ParticipantCard } from '@/components/features/bookings/ParticipantCard'
import { PackagePhotosGallery } from '@/components/features/bookings/PackagePhotosGallery'
import { RefuseBookingDialog } from '@/components/features/bookings/RefuseBookingDialog'
import { CancelBookingDialog } from '@/components/features/bookings/CancelBookingDialog'
import { acceptBooking } from '@/lib/actions/booking-requests'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type BookingStatus = 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled'

interface BookingDetail {
  id: string
  status: BookingStatus
  weight_kg: number
  total_price: number | null
  description: string | null
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
  sender: {
    id: string
    firstname: string | null
    lastname: string | null
    avatar_url: string | null
    rating: number | null
    completed_services: number | null
  }
  traveler: {
    id: string
    firstname: string | null
    lastname: string | null
    avatar_url: string | null
    rating: number | null
    completed_services: number | null
  }
  announcement: {
    origin_country: string
    origin_city: string
    destination_country: string
    destination_city: string
    departure_date: string
    arrival_date: string | null
  }
}

interface BookingDetailPageProps {
  params: { id: string }
}

export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const router = useRouter()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)

  useEffect(() => {
    loadBookingDetails()
  }, [params.id])

  const loadBookingDetails = async () => {
    try {
      const supabase = createClient()
      
      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Vous devez être connecté')
        router.push('/login')
        return
      }
      setCurrentUserId(user.id)

      // Récupérer les détails du booking
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          sender:sender_id (
            id,
            firstname,
            lastname,
            avatar_url,
            rating,
            completed_services
          ),
          traveler:traveler_id (
            id,
            firstname,
            lastname,
            avatar_url,
            rating,
            completed_services
          ),
          announcement:announcement_id (
            origin_country,
            origin_city,
            destination_country,
            destination_city,
            departure_date,
            arrival_date
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error

      // Vérifier que l'utilisateur est autorisé
      if (data.sender_id !== user.id && data.traveler_id !== user.id) {
        toast.error('Accès non autorisé')
        router.push('/dashboard/colis')
        return
      }

      setBooking(data as unknown as BookingDetail)
    } catch (error) {
      console.error('Error loading booking:', error)
      toast.error('Erreur lors du chargement des détails')
      router.push('/dashboard/colis')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!booking || !currentUserId) {
    return null
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
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
        }
      />

      {/* Statut et Informations principales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Statut de la réservation</CardTitle>
            <BookingStatusBadge status={booking.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {booking.tracking_number && (
            <div>
              <p className="text-sm text-muted-foreground">Numéro de suivi</p>
              <p className="font-mono font-medium">{booking.tracking_number}</p>
            </div>
          )}

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Weight className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Poids</p>
                <p className="font-medium">{booking.weight_kg} kg</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Prix total</p>
                <p className="font-medium">
                  {booking.total_price ? `${booking.total_price}€` : 'Non calculé'}
                </p>
              </div>
            </div>

            {booking.insurance_opted && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Assurance</p>
                  <p className="font-medium">
                    Souscrite ({booking.package_value}€)
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Créée le</p>
                <p className="font-medium">
                  {format(new Date(booking.created_at), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
          </div>

          {booking.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium">Description du colis</p>
                <p className="mt-1 text-sm text-muted-foreground">{booking.description}</p>
              </div>
            </>
          )}

          {booking.refused_reason && (
            <>
              <Separator />
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm font-medium text-destructive">Raison du refus</p>
                <p className="mt-1 text-sm text-muted-foreground">{booking.refused_reason}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Timeline du trajet */}
      <Card>
        <CardHeader>
          <CardTitle>Trajet</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingTimeline
            originCountry={booking.announcement.origin_country}
            originCity={booking.announcement.origin_city}
            destinationCountry={booking.announcement.destination_country}
            destinationCity={booking.announcement.destination_city}
            departureDate={booking.announcement.departure_date}
            arrivalDate={booking.announcement.arrival_date || undefined}
          />
        </CardContent>
      </Card>

      {/* Participants */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <ParticipantCard
              role="sender"
              profile={booking.sender}
              showContactButton={isTraveler && booking.status !== 'cancelled'}
              bookingId={booking.id}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <ParticipantCard
              role="traveler"
              profile={booking.traveler}
              showContactButton={isSender && booking.status !== 'cancelled'}
              bookingId={booking.id}
            />
          </CardContent>
        </Card>
      </div>

      {/* Photos du colis */}
      {booking.package_photos && booking.package_photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photos du colis</CardTitle>
          </CardHeader>
          <CardContent>
            <PackagePhotosGallery photos={booking.package_photos} />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Actions Expéditeur */}
            {isSender && booking.status === 'pending' && !booking.paid_at && (
              <>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/colis/${booking.id}/paiement`}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Payer maintenant
                  </Link>
                </Button>
                <CancelBookingDialog bookingId={booking.id} />
              </>
            )}

            {isSender && booking.status === 'confirmed' && (
              <>
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/dashboard/colis/${booking.id}/contrat`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Voir le contrat
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/dashboard/colis/${booking.id}/qr`}>
                    <QrCode className="mr-2 h-4 w-4" />
                    QR Code
                  </Link>
                </Button>
              </>
            )}

            {isSender && booking.status === 'delivered' && (
              <Button asChild className="w-full">
                <Link href={`/dashboard/colis/${booking.id}/noter`}>
                  <Star className="mr-2 h-4 w-4" />
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Acceptation...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Accepter
                    </>
                  )}
                </Button>
                <RefuseBookingDialog bookingId={booking.id} />
              </>
            )}

            {isTraveler && booking.status === 'confirmed' && (
              <>
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/dashboard/colis/${booking.id}/contrat`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Voir le contrat
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/scan/depot/${booking.id}`}>
                    <Package className="mr-2 h-4 w-4" />
                    Scanner QR dépôt
                  </Link>
                </Button>
              </>
            )}

            {isTraveler && booking.status === 'in_transit' && (
              <Button asChild className="w-full">
                <Link href={`/dashboard/scan/livraison/${booking.id}`}>
                  <Package className="mr-2 h-4 w-4" />
                  Scanner QR livraison
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

