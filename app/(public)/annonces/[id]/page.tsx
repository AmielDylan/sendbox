/**
 * Page publique de détail d'annonce
 */

import { notFound } from 'next/navigation'
import {
  getAnnouncementDetail,
  getTravelerReviews,
} from '@/lib/supabase/queries/announcement-detail'
import { incrementAnnouncementViews } from '@/lib/actions/announcement-views'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TravelerSection } from '@/components/features/announcements/TravelerSection'
import { TripTimeline } from '@/components/features/announcements/TripTimeline'
import { CapacityProgress } from '@/components/features/announcements/CapacityProgress'
import { ReviewsSection } from '@/components/features/announcements/ReviewsSection'
import { BookingForm } from '@/components/features/announcements/BookingForm'
import { Package, Edit, Trash2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import {
  deleteAnnouncement,
  markAnnouncementAsCompleted,
} from '@/lib/actions/announcement-management'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PublicAnnouncementDetailPage({
  params,
}: PageProps) {
  const { id } = await params

  // Récupérer les détails de l'annonce
  const { data: announcement, error } = await getAnnouncementDetail(id)

  if (error || !announcement) {
    notFound()
  }

  // Vérifier que l'annonce est active
  if (announcement.status !== 'active') {
    notFound()
  }

  // Incrémenter les vues
  await incrementAnnouncementViews(id)

  // Récupérer les avis du voyageur
  const { data: reviews } = await getTravelerReviews(announcement.traveler_id, 5)

  // Vérifier l'authentification et le KYC pour afficher le formulaire de réservation
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let canBook = false
  let isOwner = false
  let userKycStatus: 'pending' | 'approved' | 'rejected' | null = null

  if (user) {
    isOwner = user.id === announcement.traveler_id

    const { data: profile } = await supabase
      .from('profiles')
      .select('kyc_status')
      .eq('user_id', user.id)
      .single()

    userKycStatus = profile?.kyc_status || null

    canBook =
      !isOwner &&
      userKycStatus === 'approved' &&
      announcement.status === 'active' &&
      announcement.max_weight_kg - announcement.reserved_weight > 0
  }

  const availableWeight = announcement.max_weight_kg - announcement.reserved_weight

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={`Trajet ${announcement.origin_city} → ${announcement.destination_city}`}
          description={`Départ le ${new Date(announcement.departure_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        />
        {isOwner && (
          <div className="flex items-center gap-2">
            {announcement.status === 'active' && (
              <Link href={`/dashboard/annonces/${id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Éditer
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Détails du trajet</CardTitle>
            </CardHeader>
            <CardContent>
              <TripTimeline
                originCity={announcement.origin_city}
                originCountry={announcement.origin_country}
                destinationCity={announcement.destination_city}
                destinationCountry={announcement.destination_country}
                departureDate={announcement.departure_date}
              />
            </CardContent>
          </Card>

          {/* Capacité */}
          <Card>
            <CardHeader>
              <CardTitle>Capacité et tarification</CardTitle>
            </CardHeader>
            <CardContent>
              <CapacityProgress
                maxWeight={announcement.max_weight_kg}
                reservedWeight={announcement.reserved_weight}
                pricePerKg={announcement.price_per_kg}
              />
            </CardContent>
          </Card>

          {/* Description */}
          {announcement.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {announcement.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Avis */}
          <ReviewsSection
            reviews={reviews || []}
            travelerId={announcement.traveler_id}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Section Voyageur */}
          <TravelerSection
            travelerId={announcement.traveler_id}
            firstName={announcement.traveler_first_name}
            lastName={announcement.traveler_last_name}
            avatarUrl={announcement.traveler_avatar_url}
            rating={announcement.traveler_rating}
            servicesCount={announcement.traveler_services_count}
            memberSince={announcement.traveler_member_since || undefined}
            kycStatus={announcement.traveler_kyc_status || undefined}
          />

          {/* Stats pour le propriétaire */}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Vues</span>
                  <span className="font-medium">{announcement.views_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Demandes reçues
                  </span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Poids réservé
                  </span>
                  <span className="font-medium">
                    {announcement.reserved_weight} / {announcement.max_weight_kg} kg
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Formulaire de réservation */}
          {canBook ? (
            <BookingForm
              announcementId={announcement.id}
              maxWeight={availableWeight}
              pricePerKg={announcement.price_per_kg}
            />
          ) : !user ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Connectez-vous pour réserver ce trajet
                </p>
                <Link href="/login">
                  <Button className="w-full">Se connecter</Button>
                </Link>
              </CardContent>
            </Card>
          ) : userKycStatus !== 'approved' ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Vous devez avoir un KYC approuvé pour réserver
                </p>
                <Link href="/dashboard/reglages/kyc">
                  <Button className="w-full" variant="outline">
                    Compléter mon KYC
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : announcement.max_weight_kg - announcement.reserved_weight <= 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="h-5 w-5" />
                  <p className="text-sm">Capacité complète</p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}

