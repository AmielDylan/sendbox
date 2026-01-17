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
import { getCountryName } from "@/lib/utils/countries"

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
    <Card className="card-elevated hover:shadow-xl transition-all hover:-translate-y-1 h-full flex flex-col group">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/10 transition-all group-hover:ring-primary/30">
              <AvatarImage
                src={announcement.traveler_avatar_url || undefined}
                alt={travelerName}
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 font-display">
                {travelerInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-display font-semibold text-base sm:text-lg leading-tight">{travelerName}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-0.5 rounded-md">
                  <IconStar className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    {announcement.traveler_rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {announcement.traveler_services_count} service{announcement.traveler_services_count > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
          {showMatchScore && announcement.match_score > 0 && (
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white w-fit self-start sm:self-auto border-0 shadow-sm">
              Match {announcement.match_score}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        {/* Trajet */}
        <div className="flex items-start gap-3 bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 p-3 rounded-xl border border-primary/10">
          <IconMapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-display font-semibold text-sm sm:text-base leading-tight block">
              {announcement.departure_city}
              <span className="mx-2 text-primary">→</span>
              {announcement.arrival_city}
            </span>
            <span className="text-xs text-muted-foreground mt-1 block">
              {getCountryName(announcement.departure_country)} → {getCountryName(announcement.arrival_country)}
            </span>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2.5 bg-muted/40 px-3 py-2 rounded-lg">
          <IconCalendar className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium">
            {format(new Date(announcement.departure_date), 'd MMMM yyyy', {
              locale: fr,
            })}
          </span>
        </div>

        {/* Capacité et Prix */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-2.5 bg-primary/5 border border-primary/20 px-4 py-2.5 rounded-lg flex-1">
            <IconPackage className="h-5 w-5 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Disponible</span>
              <span className="text-sm font-bold">{announcement.available_kg} kg</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-gradient-to-br from-primary to-primary/80 text-white px-4 py-2.5 rounded-lg shadow-warm flex-1">
            <IconCurrencyEuro className="h-5 w-5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs opacity-90">Prix/kg</span>
              <span className="text-lg font-bold">{announcement.price_per_kg} €</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {announcement.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {announcement.description}
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Link href={`/annonces/${announcement.id}`} className="w-full">
          <Button className="w-full h-12 text-base shadow-warm hover:shadow-xl transition-all hover:-translate-y-0.5 font-display" variant="default">
            Voir les détails
            <IconArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}












