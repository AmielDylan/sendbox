/**
 * Composant Card pour afficher une annonce
 */

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { IconStar, IconMapPin, IconCalendar, IconPackage, IconCurrencyEuro, IconArrowRight, IconArrowNarrowRight } from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { AnnouncementResult } from "@/lib/shared/db/queries/announcements"
import { generateInitials, getAvatarUrl } from "@/lib/core/profile/utils"
import { getCountryName } from "@/lib/utils/countries"

interface AnnouncementCardProps {
  announcement: AnnouncementResult
  showMatchScore?: boolean
}

export function AnnouncementCard({
  announcement,
  showMatchScore = false,
}: AnnouncementCardProps) {
  const travelerName = `${announcement.traveler_first_name || ''} ${announcement.traveler_last_name || ''}`.trim() || 'Voyageur'
  const travelerInitials = generateInitials(
    announcement.traveler_first_name,
    announcement.traveler_last_name
  )
  const travelerAvatar = getAvatarUrl(
    announcement.traveler_avatar_url,
    announcement.traveler_id || travelerName
  )

  return (
    <Link href={`/annonces/${announcement.id}`} className="block h-full cursor-pointer">
      <Card className="h-full flex flex-col justify-between rounded-xl border border-border/60 shadow-none hover:border-primary/40 hover:bg-muted/30 transition-all duration-300 group relative overflow-hidden">
        {/* Hover Highlight Line */}
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300" />

        <CardContent className="p-4 sm:p-5 flex-1">
          {/* Top Row: Country Route & Price */}


          {/* Main Row: Cities & Badges */}
          {/* Main Row: Cities & Badges */}
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <h3 className="font-display font-bold text-lg sm:text-2xl text-foreground leading-tight group-hover:text-primary transition-colors flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="flex items-center gap-2">
                  {announcement.origin_city}
                  <IconArrowNarrowRight className="h-6 w-6 text-muted-foreground/50" stroke={1} />
                  {announcement.destination_city}
                </span>
              </h3>
              <div className="text-right leading-none shrink-0">
                <span className="font-display font-bold text-xl text-primary">{announcement.price_per_kg} €</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase ml-1">/kg</span>
              </div>
            </div>

            {/* Tags Grid - Fills horizontal space */}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Badge variant="secondary" className="flex-1 justify-start items-start flex-col bg-muted/50 text-foreground hover:bg-muted border-0 font-sans px-3 py-2 h-auto whitespace-nowrap">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Dates du voyage</span>
                <div className="flex items-center font-bold text-sm">
                  <IconCalendar className="h-3.5 w-3.5 mr-1.5 opacity-70" stroke={1.5} />
                  {format(new Date(announcement.departure_date), 'd MMMM', { locale: fr })}
                  <IconArrowNarrowRight className="h-3.5 w-3.5 mx-1.5 text-muted-foreground/70" stroke={1} />
                  {announcement.arrival_date ? format(new Date(announcement.arrival_date), 'd MMMM', { locale: fr }) : '?'}
                </div>
              </Badge>

              <div className="flex gap-2 flex-1 sm:flex-none">
                <Badge variant="secondary" className="flex-1 sm:flex-none justify-start items-start flex-col bg-primary/5 text-primary hover:bg-primary/10 border-0 font-sans px-3 py-2 h-auto whitespace-nowrap min-w-[100px]">
                  <span className="text-[10px] text-primary/70 font-medium uppercase tracking-wider mb-1">Disponible</span>
                  <div className="flex items-center font-bold text-sm">
                    <IconPackage className="h-3.5 w-3.5 mr-1.5 opacity-70" stroke={1.5} />
                    {announcement.max_weight_kg} kg
                  </div>
                </Badge>

                {showMatchScore && announcement.match_score > 0 && (
                  <Badge variant="outline" className="flex-1 sm:flex-none justify-start items-start flex-col text-emerald-600 border-emerald-500/20 bg-emerald-500/5 font-sans px-3 py-2 h-auto whitespace-nowrap">
                    <span className="text-[10px] text-emerald-600/70 font-medium uppercase tracking-wider mb-1">Match</span>
                    <div className="font-bold text-sm">
                      {announcement.match_score}%
                    </div>
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 sm:p-5 pt-2 mt-auto border-t border-border/30 bg-muted/20">
          {/* Traveler Info */}
          <div className="flex items-center gap-3 w-full">
            <Avatar className="h-8 w-8 ring-1 ring-border/50">
              <AvatarImage src={travelerAvatar} alt={travelerName} />
              <AvatarFallback className="bg-background text-[10px]">{travelerInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-none mb-1">{travelerName}</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                  <IconStar className="h-3 w-3 fill-amber-500" />
                  {announcement.traveler_rating.toFixed(1)}
                </div>
                <span className="text-[10px] text-muted-foreground truncate">
                  • {announcement.traveler_services_count} voyages
                </span>
              </div>
            </div>
            <IconArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
