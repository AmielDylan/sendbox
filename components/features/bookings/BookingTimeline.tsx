/**
 * Timeline du trajet pour une réservation
 */

import { IconMapPin, IconCalendar } from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface BookingTimelineProps {
  originCountry: string
  originCity: string
  destinationCountry: string
  destinationCity: string
  departureDate: string
  arrivalDate?: string
}

export function BookingTimeline({
  originCountry,
  originCity,
  destinationCity,
  destinationCountry,
  departureDate,
  arrivalDate,
}: BookingTimelineProps) {
  return (
    <div className="space-y-4">
      {/* Départ */}
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <IconMapPin className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-medium">{originCity}</p>
          <p className="text-sm text-muted-foreground">
            {originCountry === 'FR' ? 'France' : 'Bénin'}
          </p>
          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <IconCalendar className="h-3 w-3" />
            <span>
              Départ : {format(new Date(departureDate), 'dd MMMM yyyy', { locale: fr })}
            </span>
          </div>
        </div>
      </div>

      {/* Ligne de connexion */}
      <div className="ml-4 h-8 w-0.5 bg-border" />

      {/* Arrivée */}
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <IconMapPin className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-medium">{destinationCity}</p>
          <p className="text-sm text-muted-foreground">
            {destinationCountry === 'FR' ? 'France' : 'Bénin'}
          </p>
          {arrivalDate && (
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <IconCalendar className="h-3 w-3" />
              <span>
                Arrivée : {format(new Date(arrivalDate), 'dd MMMM yyyy', { locale: fr })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}






