/**
 * Page publique de détail d'annonce
 */

import { notFound } from 'next/navigation'
import {
  getAnnouncementDetail,
  getTravelerReviews,
} from '@/lib/shared/db/queries/announcement-detail'
import { createClient } from '@/lib/shared/db/server'
import { isFeatureEnabled } from '@/lib/shared/config/features'
import { Button } from '@/components/ui/button'
import { TravelerSection } from '@/components/features/announcements/TravelerSection'
import { TripTimeline } from '@/components/features/announcements/TripTimeline'
import { CapacityProgress } from '@/components/features/announcements/CapacityProgress'
import { ReviewsSection } from '@/components/features/announcements/ReviewsSection'
import { BookingForm } from '@/components/features/announcements/BookingForm'
import { ViewTracker } from '@/components/features/announcements/ViewTracker'
import {
  IconPackage,
  IconEdit,
  IconCircleCheck,
  IconArrowNarrowRight,
  IconCalendar,
} from '@tabler/icons-react'
import Link from 'next/link'

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
  const { data: announcement, error } = await getAnnouncementDetail(
    id,
    supabase
  )

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
  const { data: reviews } = await getTravelerReviews(
    announcement.traveler_id,
    5,
    supabase
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let canBook = false
  let isOwner = false
  let userKycStatus: 'pending' | 'approved' | 'rejected' | 'incomplete' | null =
    null

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

  const availableWeight = Math.max(
    0,
    (announcement.available_kg || 0) - (announcement.reserved_weight || 0)
  )

  return (
    <>
      <ViewTracker announcementId={id} />

      <div className="container mx-auto px-8 sm:px-16 lg:px-24 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 border-b border-border/40 pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground flex flex-wrap items-center gap-x-3">
              <span>{announcement.departure_city}</span>
              <IconArrowNarrowRight
                className="h-6 w-6 text-muted-foreground/40"
                stroke={1}
              />
              <span>{announcement.arrival_city}</span>
            </h1>
            <p className="text-base text-muted-foreground font-medium flex items-center gap-2">
              <IconCalendar className="h-4 w-4" />
              Départ le{' '}
              {new Date(announcement.departure_date).toLocaleDateString(
                'fr-FR',
                { day: 'numeric', month: 'long', year: 'numeric' }
              )}
            </p>
          </div>

          {isOwner && (
            <div className="flex items-center gap-3">
              {announcement.status === 'active' && (
                <Link href={`/dashboard/annonces/${id}/edit`}>
                  <Button
                    variant="outline"
                    className="hover:bg-primary/5 hover:border-primary/30 h-9 px-4 rounded-lg font-medium"
                  >
                    <IconEdit className="mr-2 h-4 w-4" />
                    Éditer mon annonce
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Timeline */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold">Détails du voyage</h2>
              <div className="rounded-xl border border-border/60 bg-card/30 p-6">
                <TripTimeline
                  originCity={announcement.departure_city}
                  originCountry={announcement.departure_country}
                  destinationCity={announcement.arrival_city}
                  destinationCountry={announcement.arrival_country}
                  departureDate={announcement.departure_date}
                />
              </div>
            </section>

            {/* Capacity & Pricing */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold">Capacité & Prix</h2>
              <div className="rounded-xl border border-border/60 bg-card/30 p-6">
                <CapacityProgress
                  maxWeight={announcement.available_kg || 0}
                  reservedWeight={announcement.reserved_weight || 0}
                  pricePerKg={announcement.price_per_kg || 0}
                />
              </div>
            </section>

            {/* Description */}
            {announcement.description && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold">À propos</h2>
                <div className="rounded-xl border border-border/60 bg-card/30 p-6">
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {announcement.description}
                  </p>
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="space-y-3 pt-4 border-t border-border/40">
              <ReviewsSection reviews={reviews || []} />
            </section>
          </div>

          {/* Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6 h-fit lg:sticky lg:top-24">
            {/* Traveler Card */}
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

            {/* Owner Stats */}
            {isOwner && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                <h3 className="text-base font-bold text-primary">
                  Vos Statistiques
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-sm text-muted-foreground font-medium">
                      Vues totales
                    </span>
                    <span className="font-bold text-base">
                      {announcement.views_count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-sm text-muted-foreground font-medium">
                      Réservations
                    </span>
                    <span className="font-bold text-base">0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-sm text-muted-foreground font-medium">
                      Poids restant
                    </span>
                    <span className="font-bold text-base">
                      {availableWeight}{' '}
                      <span className="text-xs text-muted-foreground font-normal">
                        / {announcement.available_kg} kg
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Booking / CTA Box */}
            <div className="rounded-xl border border-border/60 shadow-lg bg-card overflow-hidden">
              {canBook ? (
                <div className="p-1">
                  <BookingForm
                    announcementId={announcement.id}
                    maxWeight={availableWeight}
                    pricePerKg={announcement.price_per_kg}
                  />
                </div>
              ) : !user ? (
                <div className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <IconPackage
                      className="h-6 w-6 text-primary"
                      stroke={1.5}
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold">Réserver ce trajet</h3>
                    <p className="text-sm text-muted-foreground">
                      Connectez-vous pour envoyer une demande de transport.
                    </p>
                  </div>
                  <Link href="/login" className="block w-full">
                    <Button className="w-full h-11 rounded-lg shadow-warm hover:shadow-xl hover:-translate-y-0.5 transition-all">
                      Se connecter
                    </Button>
                  </Link>
                </div>
              ) : isFeatureEnabled('KYC_ENABLED') &&
                userKycStatus !== 'approved' ? (
                <div className="p-5 bg-amber-50/50 dark:bg-amber-900/10 space-y-3 text-center">
                  <div className="inline-flex p-2.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                    <IconCircleCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-amber-900 dark:text-amber-100">
                      Vérification requise
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Votre profil doit être vérifié pour effectuer une
                      réservation.
                    </p>
                  </div>
                  <Link href="/dashboard/reglages/kyc" className="block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-amber-200 hover:bg-amber-100 text-amber-800"
                    >
                      Vérifier mon profil
                    </Button>
                  </Link>
                </div>
              ) : isOwner ? (
                <div className="p-6 text-center">
                  <p className="text-sm font-medium text-muted-foreground bg-muted/50 py-2.5 rounded-lg">
                    Ceci est votre annonce
                  </p>
                </div>
              ) : availableWeight <= 0 ? (
                <div className="p-6 text-center space-y-3 bg-muted/30">
                  <IconPackage className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <div>
                    <h3 className="font-bold text-base">Complet</h3>
                    <p className="text-sm text-muted-foreground">
                      Plus de kilos disponibles pour ce trajet.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
