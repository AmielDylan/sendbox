import { z } from 'zod'
import { LOCATIONS, validateTripLocation } from '@/lib/shared/constants/locations'

const locationCountryValidator = z
  .string()
  .min(1, 'Pays requis')
  .refine(v => v in LOCATIONS, 'Pays non autorisé')

const locationCityValidator = z.string().min(1, 'Ville requise')

const locationRefine = (
  data: { departure_country: string; departure_city: string; arrival_country: string; arrival_city: string },
  ctx: z.RefinementCtx
) => {
  const depErr = validateTripLocation(data.departure_country, data.departure_city, 'departure')
  if (depErr) ctx.addIssue({ code: 'custom', message: 'Ville de départ non autorisée pour ce pays', path: ['departure_city'] })
  const arrErr = validateTripLocation(data.arrival_country, data.arrival_city, 'arrival')
  if (arrErr) ctx.addIssue({ code: 'custom', message: "Ville d'arrivée non autorisée pour ce pays", path: ['arrival_city'] })
}

export const createAnnouncementSchema = z
  .object({
    departure_country: locationCountryValidator,
    departure_city: locationCityValidator,
    departure_date: z.date({ message: 'Date de départ requise et valide' }),
    arrival_country: locationCountryValidator,
    arrival_city: locationCityValidator,
    arrival_date: z.date({ message: "Date d'arrivée requise et valide" }),
    available_kg: z.number().min(1, 'Minimum 1 kg').max(30, 'Maximum 30 kg'),
    price_per_kg: z.number().min(5, 'Minimum 5 € par kg').max(100, 'Maximum 100 € par kg'),
    description: z.string().max(500, 'Description trop longue').optional(),
    intent: z.enum(['draft', 'publish']).optional(),
    sendbox_available: z.boolean().optional(),
  })
  .superRefine(locationRefine)
  .refine(data => data.arrival_date > data.departure_date, {
    message: "La date d'arrivée doit être après le départ",
    path: ['arrival_date'],
  })
  .refine(
    data => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return data.departure_date >= today
    },
    {
      message: "La date de départ doit être aujourd'hui ou dans le futur",
      path: ['departure_date'],
    }
  )

export const updateAnnouncementSchema = z
  .object({
    departure_country: locationCountryValidator,
    departure_city: locationCityValidator,
    departure_date: z.date({ message: 'Date de départ requise et valide' }),
    arrival_country: locationCountryValidator,
    arrival_city: locationCityValidator,
    arrival_date: z.date({ message: "Date d'arrivée requise et valide" }),
    available_kg: z.number().min(1, 'Minimum 1 kg').max(30, 'Maximum 30 kg'),
    price_per_kg: z.number().min(5, 'Minimum 5 € par kg').max(100, 'Maximum 100 € par kg'),
    description: z.string().max(500, 'Description trop longue').optional(),
  })
  .superRefine(locationRefine)
  .refine(data => data.arrival_date > data.departure_date, {
    message: "La date d'arrivée doit être après le départ",
    path: ['arrival_date'],
  })

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>
