/**
 * Schémas de validation Zod pour les annonces
 */

import { z } from 'zod'

// Pays disponibles
export const COUNTRIES = ['FR', 'BJ'] as const
export type Country = (typeof COUNTRIES)[number]

// Schéma de création d'annonce (avec validation de date future)
export const createAnnouncementSchema = z
  .object({
    departure_country: z.enum(COUNTRIES, {
      message: 'Pays de départ invalide',
    }),
    departure_city: z
      .string()
      .min(2, 'Ville de départ requise (minimum 2 caractères)')
      .max(100, 'Ville trop longue (maximum 100 caractères)'),
    departure_date: z.date({
      message: 'Date de départ requise et valide',
    }),
    arrival_country: z.enum(COUNTRIES, {
      message: "Pays d'arrivée invalide",
    }),
    arrival_city: z
      .string()
      .min(2, "Ville d'arrivée requise (minimum 2 caractères)")
      .max(100, 'Ville trop longue (maximum 100 caractères)'),
    arrival_date: z.date({
      message: "Date d'arrivée requise et valide",
    }),
    available_kg: z.number().min(1, 'Minimum 1 kg').max(30, 'Maximum 30 kg'),
    price_per_kg: z
      .number()
      .min(5, 'Minimum 5 € par kg')
      .max(100, 'Maximum 100 € par kg'),
    description: z.string().max(500, 'Description trop longue').optional(),
    intent: z.enum(['draft', 'publish']).optional(),
  })
  .refine(data => data.arrival_date > data.departure_date, {
    message: "La date d'arrivée doit être après le départ",
    path: ['arrival_date'],
  })
  .refine(data => data.departure_country !== data.arrival_country, {
    message: "Pays de départ et d'arrivée doivent être différents",
    path: ['arrival_country'],
  })
  .refine(data => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return data.departure_date >= today
  }, {
    message: 'La date de départ doit être aujourd\'hui ou dans le futur',
    path: ['departure_date'],
  })

// Schéma de mise à jour d'annonce (sans validation de date future pour permettre la modification)
export const updateAnnouncementSchema = z
  .object({
    departure_country: z.enum(COUNTRIES, {
      message: 'Pays de départ invalide',
    }),
    departure_city: z
      .string()
      .min(2, 'Ville de départ requise (minimum 2 caractères)')
      .max(100, 'Ville trop longue (maximum 100 caractères)'),
    departure_date: z.date({
      message: 'Date de départ requise et valide',
    }),
    arrival_country: z.enum(COUNTRIES, {
      message: "Pays d'arrivée invalide",
    }),
    arrival_city: z
      .string()
      .min(2, "Ville d'arrivée requise (minimum 2 caractères)")
      .max(100, 'Ville trop longue (maximum 100 caractères)'),
    arrival_date: z.date({
      message: "Date d'arrivée requise et valide",
    }),
    available_kg: z.number().min(1, 'Minimum 1 kg').max(30, 'Maximum 30 kg'),
    price_per_kg: z
      .number()
      .min(5, 'Minimum 5 € par kg')
      .max(100, 'Maximum 100 € par kg'),
    description: z.string().max(500, 'Description trop longue').optional(),
  })
  .refine(data => data.arrival_date > data.departure_date, {
    message: "La date d'arrivée doit être après le départ",
    path: ['arrival_date'],
  })
  .refine(data => data.departure_country !== data.arrival_country, {
    message: "Pays de départ et d'arrivée doivent être différents",
    path: ['arrival_country'],
  })

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>
