/**
 * Page profil publique avec réputation et avis
 */

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from "@/lib/shared/db/server"
import { getUserRatings, getUserRatingStats } from "@/lib/core/ratings/actions"
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/features/ratings/StarRating'
import { RatingDistribution } from '@/components/features/ratings/RatingDistribution'
import { IconStar, IconCircleCheck, IconBriefcase, IconAward, IconLoader2 } from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { generateInitials } from "@/lib/core/profile/utils"
import Link from 'next/link'

interface ProfilePageProps {
  params: Promise<{ user_id: string }>
}

async function ProfilePageContent({ params }: ProfilePageProps) {
  const { user_id } = await params
  const supabase = await createClient()

  // Récupérer le profil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user_id)
    .single()

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Profil de ${profile.firstname} ${profile.lastname}`}
        description="Informations et réputation"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Profil' },
        ]}
      />

      {/* Informations utilisateur */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {generateInitials(profile.firstname, profile.lastname)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold">
                {profile.firstname} {profile.lastname}
              </h2>
              {profile.bio && (
                <p className="text-muted-foreground mt-2">{profile.bio}</p>
              )}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                {badges.map((badge) => (
                  <Badge key={badge} variant="secondary">
                    {badge === '5 étoiles' && <IconAward className="h-3 w-3 mr-1" />}
                    {badge === 'Vérifié' && <IconCircleCheck className="h-3 w-3 mr-1" />}
                    {badge === 'Expert' && <IconBriefcase className="h-3 w-3 mr-1" />}
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Réputation */}
      <Card>
        <CardHeader>
          <CardTitle>Réputation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rating moyen */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <IconStar className="h-8 w-8 fill-yellow-400 text-yellow-400" />
              <span className="text-4xl font-bold">
                {stats.averageRating.toFixed(1)}
              </span>
              <span className="text-2xl text-muted-foreground">/ 5.0</span>
            </div>
            <p className="text-muted-foreground">
              {stats.totalRatings} avis • {stats.completedServices} services complétés
            </p>
          </div>

          {/* Distribution des ratings */}
          {stats.totalRatings > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-4">Distribution des avis</h3>
              <RatingDistribution
                distribution={stats.distribution}
                totalRatings={stats.totalRatings}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des avis */}
      <Card>
        <CardHeader>
          <CardTitle>Avis ({stats.totalRatings})</CardTitle>
        </CardHeader>
        <CardContent>
          {ratingsData.ratings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun avis pour le moment
            </p>
          ) : (
            <div className="space-y-6">
              {ratingsData.ratings.map((rating: any) => (
                <div key={rating.id} className="flex items-start gap-4 pb-6 border-b last:border-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={rating.rater?.avatar_url || undefined}
                      alt={`${rating.rater?.firstname} ${rating.rater?.lastname}`}
                    />
                    <AvatarFallback>
                      {generateInitials(
                        rating.rater?.firstname,
                        rating.rater?.lastname
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold">
                          {rating.rater?.firstname} {rating.rater?.lastname}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(rating.created_at), 'PP', { locale: fr })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{rating.rating}</span>
                      </div>
                    </div>
                    {rating.comment && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {rating.comment}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {ratingsData.totalPages && ratingsData.totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  <Button variant="outline" disabled>
                    Précédent
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Page 1 sur {ratingsData.totalPages || 1}
                  </span>
                  <Button variant="outline" disabled>
                    Suivant
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
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

