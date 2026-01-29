import { createMockSender, createMockTraveler, createMockAdmin, type MockUser } from '../factories/user.factory'

/**
 * Fixtures utilisateurs - Données de test pré-définies et réutilisables
 */

// Sender avec KYC approuvé
export const MOCK_SENDER: MockUser = createMockSender({
  id: 'sender-test-1',
  email: 'sender@sendbox.test',
  first_name: 'Jean',
  last_name: 'Dupont',
  kyc_status: 'approved',
  kyc_verified_at: '2024-01-01T00:00:00.000Z',
})

// Traveler avec KYC approuvé
export const MOCK_TRAVELER: MockUser = createMockTraveler({
  id: 'traveler-test-1',
  email: 'traveler@sendbox.test',
  first_name: 'Marie',
  last_name: 'Martin',
  kyc_status: 'approved',
  kyc_verified_at: '2024-01-01T00:00:00.000Z',
})

// Admin
export const MOCK_ADMIN: MockUser = createMockAdmin({
  id: 'admin-test-1',
  email: 'admin@sendbox.test',
  first_name: 'Admin',
  last_name: 'Sendbox',
  kyc_status: 'approved',
  kyc_verified_at: '2024-01-01T00:00:00.000Z',
})

// Sender avec KYC incomplet
export const MOCK_SENDER_INCOMPLETE_KYC: MockUser = createMockSender({
  id: 'sender-incomplete-kyc-1',
  email: 'sender-incomplete@sendbox.test',
  first_name: 'Paul',
  last_name: 'Bertrand',
  kyc_status: 'incomplete',
  kyc_verified_at: null,
})

// Sender avec KYC en attente
export const MOCK_SENDER_PENDING_KYC: MockUser = createMockSender({
  id: 'sender-pending-kyc-1',
  email: 'sender-pending@sendbox.test',
  first_name: 'Sophie',
  last_name: 'Lemoine',
  kyc_status: 'pending',
  kyc_verified_at: null,
})

// Sender avec KYC rejeté
export const MOCK_SENDER_REJECTED_KYC: MockUser = createMockSender({
  id: 'sender-rejected-kyc-1',
  email: 'sender-rejected@sendbox.test',
  first_name: 'Pierre',
  last_name: 'Durant',
  kyc_status: 'rejected',
  kyc_verified_at: null,
})

// Traveler avec KYC incomplet
export const MOCK_TRAVELER_INCOMPLETE_KYC: MockUser = createMockTraveler({
  id: 'traveler-incomplete-kyc-1',
  email: 'traveler-incomplete@sendbox.test',
  first_name: 'Lucie',
  last_name: 'Moreau',
  kyc_status: 'incomplete',
  kyc_verified_at: null,
})

// User avec les deux rôles
export const MOCK_USER_BOTH: MockUser = {
  id: 'user-both-1',
  email: 'both@sendbox.test',
  first_name: 'Alexandre',
  last_name: 'Laurent',
  role: 'both',
  kyc_status: 'approved',
  kyc_verified_at: '2024-01-01T00:00:00.000Z',
  phone: '+33 6 12 34 56 78',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=both',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

// Tableau de tous les utilisateurs fixtures
export const ALL_MOCK_USERS: MockUser[] = [
  MOCK_SENDER,
  MOCK_TRAVELER,
  MOCK_ADMIN,
  MOCK_SENDER_INCOMPLETE_KYC,
  MOCK_SENDER_PENDING_KYC,
  MOCK_SENDER_REJECTED_KYC,
  MOCK_TRAVELER_INCOMPLETE_KYC,
  MOCK_USER_BOTH,
]
