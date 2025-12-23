/**
 * Carte d'affichage des participants (expéditeur/voyageur)
 */

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, MessageSquare, User } from 'lucide-react'
import { generateInitials } from '@/lib/utils/avatar'

interface ParticipantCardProps {
  role: 'sender' | 'traveler'
  profile: {
    id: string
    firstname: string | null
    lastname: string | null
    avatar_url: string | null
    rating: number | null
    completed_services: number | null
  }
  showContactButton?: boolean
  bookingId?: string
}

export function ParticipantCard({
  role,
  profile,
  showContactButton = false,
  bookingId,
}: ParticipantCardProps) {
  const displayName = `${profile.firstname || ''} ${profile.lastname || ''}`.trim() || 'Utilisateur'
  const initials = generateInitials(profile.firstname, profile.lastname)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {role === 'sender' ? 'Expéditeur' : 'Voyageur'}
        </h3>
        <Badge variant="outline">
          <User className="mr-1 h-3 w-3" />
          {role === 'sender' ? 'Envoi' : 'Transport'}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <Link
            href={`/profil/${profile.id}`}
            className="font-medium hover:underline"
          >
            {displayName}
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {profile.rating !== null && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{profile.rating.toFixed(1)}</span>
              </div>
            )}
            {profile.completed_services !== null && (
              <span>• {profile.completed_services} service{profile.completed_services > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>

      {showContactButton && bookingId && (
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/dashboard/messages?booking=${bookingId}`}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Contacter
          </Link>
        </Button>
      )}
    </div>
  )
}





