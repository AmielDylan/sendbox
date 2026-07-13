/**
 * Composant Section Avis
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconStar } from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  generateInitials,
  getAvatarUrl,
  getShortDisplayName,
  getShortNameParts,
} from '@/lib/core/profile/utils'
import { parseReviewComment } from '@/lib/core/ratings/display'

interface Review {
  id: string
  rater_firstname: string | null
  rater_lastname: string | null
  rater_avatar_url: string | null
  rating: number
  comment: string | null
  created_at: string
}

interface ReviewsSectionProps {
  reviews: Review[]
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Avis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun avis pour le moment
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avis ({reviews.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.map(review => {
          const raterName = getShortDisplayName(
            review.rater_firstname,
            review.rater_lastname,
            'Utilisateur'
          )
          const raterNameParts = getShortNameParts(
            review.rater_firstname,
            review.rater_lastname
          )
          const raterInitials = generateInitials(
            raterNameParts.firstName,
            raterNameParts.lastName
          )
          const raterAvatar = getAvatarUrl(review.rater_avatar_url, raterName)
          const parsedComment = parseReviewComment(review.comment)

          return (
            <div
              key={review.id}
              className="flex gap-4 pb-4 border-b last:border-0"
            >
              <Avatar>
                <AvatarImage src={raterAvatar} alt={raterName} />
                <AvatarFallback>{raterInitials}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{raterName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), 'd MMMM yyyy', {
                        locale: fr,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{review.rating}</span>
                  </div>
                </div>

                {parsedComment.criteria.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {parsedComment.criteria.map(criterion => (
                      <Badge
                        key={criterion}
                        variant="outline"
                        className="px-2 py-0.5 text-[10px] font-medium"
                      >
                        {criterion}
                      </Badge>
                    ))}
                  </div>
                )}

                {parsedComment.comment && (
                  <p className="text-sm text-muted-foreground">
                    {parsedComment.comment}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
