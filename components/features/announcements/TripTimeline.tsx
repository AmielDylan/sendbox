/**
 * Composant Timeline pour afficher le trajet
 */

import { IconMapPin } from '@tabler/icons-react'
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
  const depDate = typeof departureDate === 'string' ? new Date(departureDate) : departureDate
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
      <div className="flex items-center gap-4">
        {/* Départ */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <IconMapPin className="h-5 w-5 text-primary" />
            <span className="text-2xl">
              {COUNTRY_FLAGS[originCountry] || '📍'}
            </span>
            <h3 className="font-semibold text-lg">{originCity}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {format(depDate, 'd MMMM yyyy', { locale: fr })}
          </p>
        </div>

        {/* Flèche */}
        <div className="flex flex-col items-center">
          <div className="h-0.5 w-16 bg-primary" />
          <div className="text-2xl my-2">→</div>
          {duration && (
            <p className="text-xs text-muted-foreground">{duration} jour{duration > 1 ? 's' : ''}</p>
          )}
        </div>

        {/* Arrivée */}
        <div className="flex-1 text-right">
          <div className="flex items-center justify-end gap-2 mb-2">
            <h3 className="font-semibold text-lg">{destinationCity}</h3>
            <span className="text-2xl">
              {COUNTRY_FLAGS[destinationCountry] || '📍'}
            </span>
            <IconMapPin className="h-5 w-5 text-primary" />
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











