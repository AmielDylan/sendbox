import {
  createMockAnnouncement,
  type MockAnnouncement,
} from '../factories/announcement.factory'
import { MOCK_TRAVELER } from './users'

/**
 * Fixtures annonces - Données de test pré-définies et réutilisables
 */

// Annonce Paris → Cotonou publiée
export const MOCK_ANNOUNCEMENT_PARIS_COTONOU: MockAnnouncement =
  createMockAnnouncement({
    id: 'announcement-paris-cotonou-1',
    traveler_id: MOCK_TRAVELER.id,
    title: 'Paris → Cotonou',
    description:
      'Vol direct Paris-Cotonou, disponible pour transporter vos colis en toute sécurité.',
    departure_country: 'France',
    departure_city: 'Paris',
    arrival_country: 'Bénin',
    arrival_city: 'Cotonou',
    departure_date: '2024-06-15T10:00:00.000Z',
    arrival_date: '2024-06-15T16:00:00.000Z',
    available_kg: 20,
    price_per_kg: 10,
    status: 'published',
    views_count: 42,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  })

// Annonce Paris → Porto-Novo publiée
export const MOCK_ANNOUNCEMENT_PARIS_PORTO_NOVO: MockAnnouncement =
  createMockAnnouncement({
    id: 'announcement-paris-porto-novo-1',
    traveler_id: MOCK_TRAVELER.id,
    title: 'Paris → Porto-Novo',
    description: 'Trajet Paris-Porto-Novo avec escale. Poids disponible 15kg.',
    departure_country: 'France',
    departure_city: 'Paris',
    arrival_country: 'Bénin',
    arrival_city: 'Porto-Novo',
    departure_date: '2024-07-01T08:00:00.000Z',
    arrival_date: '2024-07-01T18:00:00.000Z',
    available_kg: 15,
    price_per_kg: 12,
    status: 'published',
    views_count: 23,
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
  })

// Annonce en draft
export const MOCK_ANNOUNCEMENT_DRAFT: MockAnnouncement = createMockAnnouncement(
  {
    id: 'announcement-draft-1',
    traveler_id: MOCK_TRAVELER.id,
    title: 'Lyon → Cotonou (Draft)',
    description: 'Annonce en cours de création...',
    departure_country: 'France',
    departure_city: 'Lyon',
    arrival_country: 'Bénin',
    arrival_city: 'Cotonou',
    departure_date: '2024-08-01T10:00:00.000Z',
    arrival_date: '2024-08-01T16:00:00.000Z',
    available_kg: 10,
    price_per_kg: 15,
    status: 'draft',
    views_count: 0,
    created_at: '2024-01-03T00:00:00.000Z',
    updated_at: '2024-01-03T00:00:00.000Z',
  }
)

// Annonce archivée
export const MOCK_ANNOUNCEMENT_ARCHIVED: MockAnnouncement =
  createMockAnnouncement({
    id: 'announcement-archived-1',
    traveler_id: MOCK_TRAVELER.id,
    title: 'Marseille → Cotonou (Archivée)',
    description: 'Voyage effectué le mois dernier.',
    departure_country: 'France',
    departure_city: 'Marseille',
    arrival_country: 'Bénin',
    arrival_city: 'Cotonou',
    departure_date: '2023-12-01T10:00:00.000Z',
    arrival_date: '2023-12-01T16:00:00.000Z',
    available_kg: 25,
    price_per_kg: 8,
    status: 'archived',
    views_count: 156,
    created_at: '2023-11-01T00:00:00.000Z',
    updated_at: '2023-12-15T00:00:00.000Z',
  })

// Annonce avec prix élevé
export const MOCK_ANNOUNCEMENT_HIGH_PRICE: MockAnnouncement =
  createMockAnnouncement({
    id: 'announcement-high-price-1',
    traveler_id: MOCK_TRAVELER.id,
    title: 'Paris → Cotonou (Express)',
    description: 'Service express avec livraison garantie en 24h.',
    departure_country: 'France',
    departure_city: 'Paris',
    arrival_country: 'Bénin',
    arrival_city: 'Cotonou',
    departure_date: '2024-06-20T06:00:00.000Z',
    arrival_date: '2024-06-20T12:00:00.000Z',
    available_kg: 10,
    price_per_kg: 25,
    status: 'published',
    views_count: 8,
    created_at: '2024-01-04T00:00:00.000Z',
    updated_at: '2024-01-04T00:00:00.000Z',
  })

// Annonce avec beaucoup de poids disponible
export const MOCK_ANNOUNCEMENT_HIGH_WEIGHT: MockAnnouncement =
  createMockAnnouncement({
    id: 'announcement-high-weight-1',
    traveler_id: MOCK_TRAVELER.id,
    title: 'Paris → Cotonou (Gros volume)',
    description: 'Capacité importante pour vos gros colis.',
    departure_country: 'France',
    departure_city: 'Paris',
    arrival_country: 'Bénin',
    arrival_city: 'Cotonou',
    departure_date: '2024-06-25T10:00:00.000Z',
    arrival_date: '2024-06-25T16:00:00.000Z',
    available_kg: 50,
    price_per_kg: 7,
    status: 'published',
    views_count: 67,
    created_at: '2024-01-05T00:00:00.000Z',
    updated_at: '2024-01-05T00:00:00.000Z',
  })

// Tableau de toutes les annonces fixtures
export const ALL_MOCK_ANNOUNCEMENTS: MockAnnouncement[] = [
  MOCK_ANNOUNCEMENT_PARIS_COTONOU,
  MOCK_ANNOUNCEMENT_PARIS_PORTO_NOVO,
  MOCK_ANNOUNCEMENT_DRAFT,
  MOCK_ANNOUNCEMENT_ARCHIVED,
  MOCK_ANNOUNCEMENT_HIGH_PRICE,
  MOCK_ANNOUNCEMENT_HIGH_WEIGHT,
]
