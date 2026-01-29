import { faker } from '@faker-js/faker'
import { createMockTraveler, type MockUser } from './user.factory'

/**
 * Factory pour créer des annonces de test
 */

export type MockAnnouncementStatus = 'draft' | 'published' | 'archived'

export interface MockAnnouncement {
  id: string
  traveler_id: string
  title: string
  description: string
  departure_country: string
  departure_city: string
  arrival_country: string
  arrival_city: string
  departure_date: string
  arrival_date: string
  available_kg: number
  price_per_kg: number
  status: MockAnnouncementStatus
  views_count: number
  created_at: string
  updated_at: string
}

/**
 * Crée une mock announcement avec des données aléatoires ou personnalisées
 */
export function createMockAnnouncement(
  overrides?: Partial<MockAnnouncement> & { traveler?: MockUser }
): MockAnnouncement {
  const now = new Date().toISOString()
  const departureDate = faker.date.future({ years: 0.5 }).toISOString()
  const arrivalDate = faker.date.soon({ days: 7, refDate: departureDate }).toISOString()

  // Créer un traveler si pas fourni
  const traveler = overrides?.traveler || createMockTraveler()

  return {
    id: faker.string.uuid(),
    traveler_id: traveler.id,
    title: `${faker.location.city()} → ${faker.location.city()}`,
    description: faker.lorem.paragraph(),
    departure_country: 'France',
    departure_city: 'Paris',
    arrival_country: 'Bénin',
    arrival_city: 'Cotonou',
    departure_date: departureDate,
    arrival_date: arrivalDate,
    available_kg: faker.number.int({ min: 5, max: 30 }),
    price_per_kg: faker.number.int({ min: 5, max: 15 }),
    status: 'published',
    views_count: faker.number.int({ min: 0, max: 100 }),
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

/**
 * Crée une annonce draft
 */
export function createMockDraftAnnouncement(
  overrides?: Partial<MockAnnouncement>
): MockAnnouncement {
  return createMockAnnouncement({
    status: 'draft',
    ...overrides,
  })
}

/**
 * Crée une annonce publiée
 */
export function createMockPublishedAnnouncement(
  overrides?: Partial<MockAnnouncement>
): MockAnnouncement {
  return createMockAnnouncement({
    status: 'published',
    ...overrides,
  })
}

/**
 * Crée une annonce archivée
 */
export function createMockArchivedAnnouncement(
  overrides?: Partial<MockAnnouncement>
): MockAnnouncement {
  return createMockAnnouncement({
    status: 'archived',
    ...overrides,
  })
}

/**
 * Crée une annonce Paris → Cotonou
 */
export function createMockParisCotonouAnnouncement(
  overrides?: Partial<MockAnnouncement>
): MockAnnouncement {
  return createMockAnnouncement({
    title: 'Paris → Cotonou',
    departure_country: 'France',
    departure_city: 'Paris',
    arrival_country: 'Bénin',
    arrival_city: 'Cotonou',
    ...overrides,
  })
}

/**
 * Crée plusieurs annonces de test
 */
export function createMockAnnouncements(
  count: number,
  overrides?: Partial<MockAnnouncement>
): MockAnnouncement[] {
  return Array.from({ length: count }, () => createMockAnnouncement(overrides))
}
