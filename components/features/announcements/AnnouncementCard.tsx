/**
 * Composant Card pour afficher une annonce
 */

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { IconStar, IconMapPin, IconCalendar, IconPackage, IconCurrencyEuro, IconArrowRight } from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { AnnouncementResult } from "@/lib/shared/db/queries/announcements"
import { generateInitials } from "@/lib/core/profile/utils"

interface AnnouncementCardProps {
  announcement: AnnouncementResult
  showMatchScore?: boolean
}

export function AnnouncementCard({
  announcement,
  showMatchScore = false,
}: AnnouncementCardProps) {
  const travelerName = `${announcement.traveler_firstname || ''} ${announcement.traveler_lastname || ''}`.trim() || 'Voyageur'
  const travelerInitials = generateInitials(
    announcement.traveler_firstname,
    announcement.traveler_lastname
  )

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                src={announcement.traveler_avatar_url || undefined}
                alt={travelerName}
              />
              <AvatarFallback>{travelerInitials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{travelerName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <IconStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">
                    {announcement.traveler_rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  ({announcement.traveler_services_count} services)
                </span>
              </div>
            </div>
          </div>
          {showMatchScore && announcement.match_score > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Match: {announcement.match_score}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trajet */}
        <div className="flex items-center gap-2">
          <IconMapPin className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {announcement.departure_city} ({announcement.departure_country}) →{' '}
            {announcement.arrival_city} ({announcement.arrival_country})
          </span>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2">
          <IconCalendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {format(new Date(announcement.departure_date), 'd MMM', {
              locale: fr,
            })}
          </span>
        </div>

        {/* Capacité et Prix */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <IconPackage className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {announcement.available_kg} kg disponibles
            </span>
          </div>
          <div className="flex items-center gap-2">
            <IconCurrencyEuro className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">
              {announcement.price_per_kg} €/kg
            </span>
          </div>
        </div>

        {/* Description */}
        {announcement.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {announcement.description}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Link href={`/annonces/${announcement.id}`} className="w-full">
          <Button className="w-full" variant="default">
            Voir détails
            <IconArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}










