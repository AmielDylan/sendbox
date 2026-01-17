/**
 * Page publique de détail d'annonce
 */

import { notFound } from 'next/navigation'
import {
  getAnnouncementDetail,
  getTravelerReviews,
} from "@/lib/shared/db/queries/announcement-detail"
import { createClient } from "@/lib/shared/db/server"
import { isFeatureEnabled } from "@/lib/shared/config/features"
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TravelerSection } from '@/components/features/announcements/TravelerSection'
import { TripTimeline } from '@/components/features/announcements/TripTimeline'
import { CapacityProgress } from '@/components/features/announcements/CapacityProgress'
import { ReviewsSection } from '@/components/features/announcements/ReviewsSection'
import { BookingForm } from '@/components/features/announcements/BookingForm'
import { ViewTracker } from '@/components/features/announcements/ViewTracker'
import { IconPackage, IconEdit, IconTrash, IconCircleCheck } from '@tabler/icons-react'
import Link from 'next/link'
import {
  deleteAnnouncement,
  markAnnouncementAsCompleted,
} from "@/lib/core/announcements/management"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PublicAnnouncementDetailPage({
  params,
}: PageProps) {
  const { id } = await params

  // Créer le client Supabase serveur
  const supabase = await createClient()

  // Récupérer les détails de l'annonce
  const { data: announcement, error } = await getAnnouncementDetail(id, supabase)

  if (error || !announcement) {
    console.error('Error fetching announcement:', error)
    notFound()
  }

  // Vérifier que l'annonce est active
  if (announcement.status !== 'active') {
    console.log('Announcement not active:', announcement.status)
    notFound()
  }

  // Récupérer les avis du voyageur
  const { data: reviews } = await getTravelerReviews(announcement.traveler_id, 5, supabase)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let canBook = false
  let isOwner = false
  let userKycStatus: 'pending' | 'approved' | 'rejected' | 'incomplete' | null = null

  if (user) {
    isOwner = user.id === announcement.traveler_id

    const { data: profile } = await supabase
      .from('profiles')
      .select('kyc_status')
      .eq('id', user.id)
      .single()

    userKycStatus = (profile?.kyc_status as any) || null

    // Déterminer si l'utilisateur peut réserver
    // Si KYC est activé, vérifier le statut KYC
    // Si KYC est désactivé, autoriser la réservation sans vérification
    const kycEnabled = isFeatureEnabled('KYC_ENABLED')
    const kycValid = kycEnabled ? userKycStatus === 'approved' : true

    canBook =
      !isOwner &&
      kycValid &&
      announcement.status === 'active' &&
      (announcement.available_kg || 0) - (announcement.reserved_weight || 0) > 0
  }

  const availableWeight = Math.max(0, (announcement.available_kg || 0) - (announcement.reserved_weight || 0))

  return (
    <>
      {/* Tracker de vues - composant client qui incrémente les vues après le montage */}
      <ViewTracker announcementId={id} />

      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                {announcement.departure_city}
                <span className="text-primary mx-3">→</span>
                {announcement.arrival_city}
              </h1>
              <p className="text-lg text-muted-foreground">
                Départ le {new Date(announcement.departure_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          {isOwner && (
            <div className="flex items-center gap-2">
              {announcement.status === 'active' && (
                <Link href={`/dashboard/annonces/${id}/edit`}>
                  <Button variant="outline" size="default" className="hover:bg-primary/5 hover:border-primary/30 transition-all">
                    <IconEdit className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Éditer</span>
                    <span className="sm:hidden">Éditer l'annonce</span>
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Détails du trajet</CardTitle>
            </CardHeader>
            <CardContent>
              <TripTimeline
                originCity={announcement.departure_city}
                originCountry={announcement.departure_country}
                destinationCity={announcement.arrival_city}
                destinationCountry={announcement.arrival_country}
                departureDate={announcement.departure_date}
              />
            </CardContent>
          </Card>

          {/* Capacité */}
          <Card className="card-elevated ">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Capacité et tarification</CardTitle>
            </CardHeader>
            <CardContent>
              <CapacityProgress
                maxWeight={announcement.available_kg || 0}
                reservedWeight={announcement.reserved_weight || 0}
                pricePerKg={announcement.price_per_kg || 0}
              />
            </CardContent>
          </Card>

          {/* Description */}
          {announcement.description && (
            <Card className="card-elevated ">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
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
            firstName={announcement.traveler_firstname}
            lastName={announcement.traveler_lastname}
            avatarUrl={announcement.traveler_avatar_url}
            rating={announcement.traveler_rating}
            servicesCount={announcement.traveler_services_count}
            memberSince={announcement.traveler_member_since || undefined}
            kycStatus={announcement.traveler_kyc_status || undefined}
          />

          {/* Stats pour le propriétaire */}
          {isOwner && (
            <Card className="card-elevated bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 ">
              <CardHeader>
                <CardTitle className="font-display text-xl">Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-background/60 rounded-lg">
                  <span className="text-sm text-muted-foreground">Vues</span>
                  <span className="font-bold text-lg">{announcement.views_count || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-background/60 rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    Demandes reçues
                  </span>
                  <span className="font-bold text-lg">0</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-background/60 rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    Poids réservé
                  </span>
                  <span className="font-bold text-lg">
                    {announcement.reserved_weight} / {announcement.available_kg} kg
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
            <Card className="card-elevated border-2 border-primary/20 ">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <IconPackage className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Connectez-vous pour réserver ce trajet
                </p>
                <Link href="/login">
                  <Button className="w-full shadow-warm hover:shadow-xl transition-all hover:-translate-y-0.5">
                    Se connecter
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : isFeatureEnabled('KYC_ENABLED') && userKycStatus !== 'approved' ? (
            <Card className="card-elevated border-2 border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20 ">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mx-auto mb-4">
                  <IconCircleCheck className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
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
          ) : isOwner ? (
            <Card className="card-elevated border-2 border-muted ">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <IconPackage className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Vous ne pouvez pas réserver votre propre annonce
                </p>
              </CardContent>
            </Card>
          ) : (announcement.available_kg || 0) - (announcement.reserved_weight || 0) <= 0 ? (
            <Card className="card-elevated border-2 border-destructive/20 bg-destructive/5 ">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <IconPackage className="h-6 w-6 text-destructive" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Capacité complète
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
      </div>
    </>
  )
}

