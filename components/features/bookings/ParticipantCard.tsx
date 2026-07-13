/**
 * Carte d'affichage des participants (expéditeur/voyageur)
 */

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { IconStar, IconMessageCircle } from '@tabler/icons-react'
import {
  generateInitials,
  getAvatarUrl,
  getShortDisplayName,
  getShortNameParts,
} from '@/lib/core/profile/utils'
import { TrustLevelBadge } from '@/components/trust/TrustLevelBadge'

interface ParticipantCardProps {
  role: 'sender' | 'traveler'
  profile:
    | {
        id: string
        firstname: string | null
        lastname: string | null
        avatar_url: string | null
        rating: number | null
        completed_services: number | null
        trust_score?: number | null
        completed_count?: number | null
        disputed_count?: number | null
      }
    | null
    | undefined
  showContactButton?: boolean
  bookingId?: string
}

export function ParticipantCard({
  role,
  profile,
  showContactButton = false,
  bookingId,
}: ParticipantCardProps) {
  const displayName = getShortDisplayName(
    profile?.firstname ?? null,
    profile?.lastname ?? null,
    'Utilisateur'
  )
  const nameParts = getShortNameParts(
    profile?.firstname ?? null,
    profile?.lastname ?? null
  )
  const initials = generateInitials(nameParts.firstName, nameParts.lastName)
  const profileId = profile?.id
  const profileRating = typeof profile?.rating === 'number' ? profile.rating : 0
  const completedServices = profile?.completed_services ?? null
  const trustScore = profile?.trust_score ?? profileRating
  const completedCount = profile?.completed_count ?? completedServices ?? 0
  const disputedCount = profile?.disputed_count ?? 0
  const avatarUrl = getAvatarUrl(
    profile?.avatar_url ?? null,
    profileId || displayName
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {role === 'sender' ? 'Expéditeur' : 'Voyageur'}
        </h3>
      </div>

      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          {profileId ? (
            <Link
              href={`/profil/${profileId}`}
              className="font-medium hover:underline"
            >
              {displayName}
            </Link>
          ) : (
            <span className="font-medium">{displayName}</span>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrustLevelBadge
              trustScore={trustScore}
              completedCount={completedCount}
              disputedCount={disputedCount}
              compact
              showScore={false}
              className="px-1.5 py-0.5 text-[10px]"
            />
            <div className="flex items-center gap-1">
              <IconStar className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{profileRating.toFixed(1)}</span>
            </div>
            {completedServices !== null && (
              <span>
                • {completedServices} service{completedServices > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {showContactButton && bookingId && (
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/dashboard/messages?booking=${bookingId}`}>
            <IconMessageCircle className="mr-2 h-4 w-4" />
            Contacter
          </Link>
        </Button>
      )}
    </div>
  )
}
