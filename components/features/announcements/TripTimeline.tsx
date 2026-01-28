/**
 * Composant Timeline pour afficher le trajet
 */

import { IconMapPin, IconArrowDown } from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface TripTimelineProps {
  originCity: string
  originCountry: string
  destinationCity: string
  destinationCountry: string
  departureDate: Date | string
  arrivalDate?: Date | string
}

const COUNTRY_FLAGS: Record<string, string> = {
  FR: '🇫🇷',
  BJ: '🇧🇯',
}

export function TripTimeline({
  originCity,
  originCountry,
  destinationCity,
  destinationCountry,
  departureDate,
  arrivalDate,
}: TripTimelineProps) {
  const depDate =
    typeof departureDate === 'string' ? new Date(departureDate) : departureDate
  const arrDate = arrivalDate
    ? typeof arrivalDate === 'string'
      ? new Date(arrivalDate)
      : arrivalDate
    : null

  const duration = arrDate
    ? Math.ceil((arrDate.getTime() - depDate.getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Départ */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
            <IconMapPin className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-2xl flex-shrink-0">
              {COUNTRY_FLAGS[originCountry] || '📍'}
            </span>
            <h3 className="font-semibold text-lg truncate">{originCity}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {format(depDate, 'd MMMM yyyy', { locale: fr })}
          </p>
        </div>

        {/* Flèche - Desktop horizontal */}
        <div className="hidden sm:flex flex-col items-center flex-shrink-0">
          <div className="h-0.5 w-16 bg-primary" />
          <div className="text-2xl my-2">→</div>
          {duration && (
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {duration} jour{duration > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Flèche - Mobile vertical */}
        <div className="flex sm:hidden flex-col items-center py-2">
          <IconArrowDown className="h-6 w-6 text-primary" />
          {duration && (
            <p className="text-xs text-muted-foreground mt-1">
              {duration} jour{duration > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Arrivée */}
        <div className="flex-1 min-w-0 text-center sm:text-right">
          <div className="flex items-center gap-2 mb-2 justify-center sm:justify-end">
            <h3 className="font-semibold text-lg truncate sm:order-1">
              {destinationCity}
            </h3>
            <span className="text-2xl flex-shrink-0 sm:order-2">
              {COUNTRY_FLAGS[destinationCountry] || '📍'}
            </span>
            <IconMapPin className="h-5 w-5 text-primary flex-shrink-0 sm:order-3" />
          </div>
          {arrDate && (
            <p className="text-sm text-muted-foreground">
              {format(arrDate, 'd MMMM yyyy', { locale: fr })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
