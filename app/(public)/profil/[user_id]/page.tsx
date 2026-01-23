/**
 * Page profil publique avec réputation et avis
 */

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from "@/lib/shared/db/server"
import { getPublicProfiles } from "@/lib/shared/db/queries/public-profiles"
import { getUserRatings, getUserRatingStats } from "@/lib/core/ratings/actions"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RatingDistribution } from '@/components/features/ratings/RatingDistribution'
import {
  IconStar,
  IconCircleCheck,
  IconBriefcase,
  IconAward,
  IconLoader2,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { generateInitials, getAvatarUrl } from "@/lib/core/profile/utils"

interface ProfilePageProps {
  params: Promise<{ user_id: string }>
}

async function ProfilePageContent({ params }: ProfilePageProps) {
  const { user_id } = await params
  const supabase = await createClient()

  // Récupérer le profil
  const { data: publicProfiles, error: profileError } = await getPublicProfiles(
    supabase,
    [user_id]
  )
  const profile = publicProfiles?.[0] || null

  if (profileError || !profile) {
    notFound()
  }

  // Récupérer les stats de rating
  const stats = await getUserRatingStats(user_id)

  // Récupérer les avis (première page)
  const ratingsData = await getUserRatings(user_id, 1, 10)

  // Déterminer les badges
  const badges: string[] = []
  if (stats.completedServices === 0) {
    badges.push('Nouveau voyageur')
  }
  if (stats.completedServices >= 50) {
    badges.push('Expert')
  }
  if (stats.averageRating >= 4.8 && stats.totalRatings >= 10) {
    badges.push('5 étoiles')
  }
  if (profile.kyc_status === 'approved') {
    badges.push('Vérifié')
  }

  const profileAvatar = getAvatarUrl(profile.avatar_url, profile.id || user_id)
  const memberSince = profile.created_at
    ? format(new Date(profile.created_at), 'MMMM yyyy', { locale: fr })
    : null

  return (
    <div className="container mx-auto px-8 sm:px-16 lg:px-24 py-8 space-y-8">
      <div className="space-y-2">
        <nav
          aria-label="Fil d'Ariane"
          className="flex items-center space-x-2 text-sm text-muted-foreground"
        >
          <span>Accueil</span>
          <span>/</span>
          <span className="text-foreground font-medium">Profil</span>
        </nav>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Profil de {profile.firstname} {profile.lastname}
            </h1>
            <p className="text-sm text-muted-foreground">
              Informations et réputation
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          {/* Informations utilisateur */}
          <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profileAvatar} />
                  <AvatarFallback className="text-lg">
                    {generateInitials(profile.firstname, profile.lastname)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">
                      {profile.firstname} {profile.lastname}
                    </h2>
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground">{profile.bio}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge) => (
                      <Badge key={badge} variant="secondary" className="text-xs">
                        {badge === '5 étoiles' && <IconAward className="h-3 w-3 mr-1" />}
                        {badge === 'Vérifié' && <IconCircleCheck className="h-3 w-3 mr-1" />}
                        {badge === 'Expert' && <IconBriefcase className="h-3 w-3 mr-1" />}
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-background/60 px-2 py-1">
                      <IconStar className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {stats.averageRating.toFixed(1)}
                    </span>
                    <span className="inline-flex items-center rounded-md border border-border/50 bg-background/60 px-2 py-1">
                      {stats.totalRatings} avis
                    </span>
                    <span className="inline-flex items-center rounded-md border border-border/50 bg-background/60 px-2 py-1">
                      {stats.completedServices} services
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Résumé */}
          <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-semibold">Résumé</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="space-y-3 text-sm text-muted-foreground">
                {memberSince && (
                  <div className="flex items-center justify-between gap-4">
                    <span>Membre depuis</span>
                    <span className="font-medium text-foreground">{memberSince}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4">
                  <span>Note moyenne</span>
                  <span className="font-medium text-foreground">
                    {stats.averageRating.toFixed(1)} / 5
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Services complétés</span>
                  <span className="font-medium text-foreground">
                    {stats.completedServices}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {/* Section Réputation */}
          <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-semibold">Réputation</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-5">
              {/* Rating moyen */}
              <div className="rounded-xl border border-border/50 bg-background/70 px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <IconStar className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                  <span className="text-3xl font-semibold">
                    {stats.averageRating.toFixed(1)}
                  </span>
                  <span className="text-base text-muted-foreground">/ 5.0</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalRatings} avis • {stats.completedServices} services complétés
                </p>
              </div>

              {/* Distribution des ratings */}
              {stats.totalRatings > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Distribution des avis
                  </h3>
                  <RatingDistribution
                    distribution={stats.distribution}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Liste des avis */}
          <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-semibold">Avis ({stats.totalRatings})</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {ratingsData.ratings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-muted bg-muted/5 py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    Aucun avis pour le moment
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ratingsData.ratings.map((rating: any) => {
                    const raterName = `${rating.rater?.firstname || ''} ${rating.rater?.lastname || ''}`.trim() || 'Utilisateur'
                    const raterAvatar = getAvatarUrl(
                      rating.rater?.avatar_url || null,
                      rating.rater?.id || raterName
                    )

                    return (
                      <div
                        key={rating.id}
                        className="rounded-xl border border-border/50 bg-background/70 p-4 flex items-start gap-3"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={raterAvatar}
                            alt={raterName}
                          />
                          <AvatarFallback>
                            {generateInitials(
                              rating.rater?.firstname,
                              rating.rater?.lastname
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold">
                                {rating.rater?.firstname} {rating.rater?.lastname}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(rating.created_at), 'PP', { locale: fr })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-semibold">
                              <IconStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {rating.rating}
                            </div>
                          </div>
                          {rating.comment && (
                            <p className="text-sm text-muted-foreground">
                              {rating.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Pagination */}
                  {ratingsData.totalPages && ratingsData.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 rounded-xl border bg-card/40 px-4 py-3">
                      <Button variant="outline" disabled className="h-8 w-8 p-0">
                        <IconChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground font-medium">
                        Page 1 sur {ratingsData.totalPages || 1}
                      </span>
                      <Button variant="outline" disabled className="h-8 w-8 p-0">
                        <IconChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ProfilePageContent params={params} />
    </Suspense>
  )
}
