/**
 * Composant Section Voyageur
 */

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  IconStar,
  IconCircleCheck,
  IconBriefcase,
  IconCalendar,
} from '@tabler/icons-react'
import {
  generateInitials,
  getAvatarUrl,
  getShortDisplayName,
  getShortNameParts,
} from '@/lib/core/profile/utils'
import { TrustLevelBadge } from '@/components/trust/TrustLevelBadge'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface TravelerSectionProps {
  travelerId: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  rating: number
  servicesCount: number
  trustScore?: number | null
  completedCount?: number | null
  disputedCount?: number | null
  memberSince?: string
  kycStatus?: 'pending' | 'approved' | 'rejected' | 'incomplete'
}

export function TravelerSection({
  travelerId,
  firstName,
  lastName,
  avatarUrl,
  rating,
  servicesCount,
  trustScore,
  completedCount,
  disputedCount,
  memberSince,
  kycStatus,
}: TravelerSectionProps) {
  const fullName = getShortDisplayName(firstName, lastName, 'Voyageur')
  const nameParts = getShortNameParts(firstName, lastName)
  const initials = generateInitials(nameParts.firstName, nameParts.lastName)
  const avatarSource = getAvatarUrl(avatarUrl, travelerId || fullName)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarSource} alt={fullName} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-lg">{fullName}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <TrustLevelBadge
                  trustScore={trustScore ?? rating}
                  completedCount={completedCount ?? servicesCount}
                  disputedCount={disputedCount}
                  compact
                />
                <div className="flex items-center gap-1">
                  <IconStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{rating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({servicesCount} service{servicesCount > 1 ? 's' : ''})
                </span>
              </div>
            </div>

            {memberSince && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconCalendar className="h-4 w-4" />
                <span>
                  Membre depuis{' '}
                  {format(new Date(memberSince), 'MMMM yyyy', { locale: fr })}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {kycStatus === 'approved' && (
                <Badge variant="default" className="bg-green-500">
                  <IconCircleCheck className="mr-1 h-3 w-3" />
                  Voyageur vérifié
                </Badge>
              )}
              {servicesCount >= 50 && (
                <Badge variant="secondary">
                  <IconBriefcase className="mr-1 h-3 w-3" />
                  Professionnel
                </Badge>
              )}
            </div>

            <Link href={`/profil/${travelerId}`}>
              <Button variant="outline" size="sm">
                Voir profil
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
