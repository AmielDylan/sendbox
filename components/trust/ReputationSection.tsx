'use client'

import { IconStar, IconStarFilled, IconShield, IconAlertTriangle } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface ReputationSectionProps {
  trustScore: number
  completedCount: number
  disputedCount: number
  uniqueSenderCount: number
  uniqueTravelerCount: number
  verificationStatus?: 'none' | 'pending' | 'verified' | 'rejected'
  recentReviews?: Array<{
    rating: number
    comment?: string | null
    publishedAt: string
    raterFirstname?: string | null
  }>
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        star <= Math.round(score)
          ? <IconStarFilled key={star} className="h-4 w-4 text-amber-400" />
          : <IconStar key={star} className="h-4 w-4 text-muted-foreground" />
      ))}
    </div>
  )
}

export function ReputationSection({
  trustScore,
  completedCount,
  disputedCount,
  uniqueSenderCount,
  uniqueTravelerCount,
  verificationStatus = 'none',
  recentReviews = [],
}: ReputationSectionProps) {
  const scorePercent = Math.min((trustScore / 5) * 100, 100)

  return (
    <div className="space-y-6">
      {/* Score principal */}
      <div className="flex items-start gap-4">
        <div className="text-center">
          <p className="text-4xl font-bold">{trustScore.toFixed(1)}</p>
          <StarRating score={trustScore} />
          <p className="mt-1 text-xs text-muted-foreground">/5</p>
        </div>

        <div className="flex-1 space-y-2">
          <Progress value={scorePercent} className="h-2" />
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground">{completedCount}</span> transactions complétées
            </div>
            <div>
              <span className="font-semibold text-foreground">{disputedCount}</span> litiges
            </div>
            <div>
              <span className="font-semibold text-foreground">{uniqueSenderCount}</span> expéditeurs uniques
            </div>
            <div>
              <span className="font-semibold text-foreground">{uniqueTravelerCount}</span> voyageurs uniques
            </div>
          </div>
        </div>
      </div>

      {/* Statut de vérification */}
      <div className="flex items-center gap-2">
        {verificationStatus === 'verified' ? (
          <Badge variant="default" className="gap-1 bg-green-500">
            <IconShield className="h-3 w-3" />
            Identité vérifiée
          </Badge>
        ) : verificationStatus === 'pending' ? (
          <Badge variant="warning" className="gap-1">
            <IconShield className="h-3 w-3" />
            Vérification en cours
          </Badge>
        ) : verificationStatus === 'rejected' ? (
          <Badge variant="destructive" className="gap-1">
            <IconAlertTriangle className="h-3 w-3" />
            Vérification refusée
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <IconShield className="h-3 w-3" />
            Non vérifié
          </Badge>
        )}
      </div>

      {/* Avis récents */}
      {recentReviews.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Avis récents</p>
          {recentReviews.map((review, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <StarRating score={review.rating} />
                <span className="text-xs text-muted-foreground">
                  {review.raterFirstname || 'Utilisateur anonyme'}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {recentReviews.length === 0 && completedCount === 0 && (
        <p className="text-sm text-muted-foreground">Aucune transaction complétée pour l&apos;instant.</p>
      )}
    </div>
  )
}
