import { faker } from '@faker-js/faker'

/**
 * Factory pour créer des utilisateurs de test
 */

export type MockUserRole = 'sender' | 'traveler' | 'both' | 'admin'
export type MockKYCStatus = 'incomplete' | 'pending' | 'approved' | 'rejected'

export interface MockUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: MockUserRole
  kyc_status: MockKYCStatus
  kyc_verified_at?: string | null
  phone?: string | null
  avatar_url?: string | null
  created_at: string
  updated_at: string
}

export interface MockProfile extends MockUser {
  // Alias pour Profile
}

/**
 * Crée un mock user avec des données aléatoires ou personnalisées
 */
export function createMockUser(overrides?: Partial<MockUser>): MockUser {
  const now = new Date().toISOString()

  return {
    id: faker.string.uuid(),
    email: faker.internet.email().toLowerCase(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    role: 'sender',
    kyc_status: 'approved',
    kyc_verified_at: now,
    phone: faker.phone.number('+33 # ## ## ## ##'),
    avatar_url: faker.image.avatar(),
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

/**
 * Crée un sender de test
 */
export function createMockSender(overrides?: Partial<MockUser>): MockUser {
  return createMockUser({
    role: 'sender',
    ...overrides,
  })
}

/**
 * Crée un traveler de test
 */
export function createMockTraveler(overrides?: Partial<MockUser>): MockUser {
  return createMockUser({
    role: 'traveler',
    ...overrides,
  })
}

/**
 * Crée un admin de test
 */
export function createMockAdmin(overrides?: Partial<MockUser>): MockUser {
  return createMockUser({
    role: 'admin',
    email: `admin-${faker.string.alphanumeric(8)}@sendbox.test`,
    ...overrides,
  })
}

/**
 * Crée un utilisateur avec KYC incomplet
 */
export function createMockUserWithIncompleteKYC(
  overrides?: Partial<MockUser>
): MockUser {
  return createMockUser({
    kyc_status: 'incomplete',
    kyc_verified_at: null,
    ...overrides,
  })
}

/**
 * Crée un utilisateur avec KYC en attente
 */
export function createMockUserWithPendingKYC(
  overrides?: Partial<MockUser>
): MockUser {
  return createMockUser({
    kyc_status: 'pending',
    kyc_verified_at: null,
    ...overrides,
  })
}

/**
 * Crée plusieurs utilisateurs de test
 */
export function createMockUsers(count: number, overrides?: Partial<MockUser>): MockUser[] {
  return Array.from({ length: count }, () => createMockUser(overrides))
}
