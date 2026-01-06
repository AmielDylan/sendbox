/**
 * Unit tests for announcements server actions
 * Tests CRUD operations for announcements
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import type { CreateAnnouncementInput } from '@/lib/core/announcements/validations'

// Mock Next.js functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Mock feature flags
vi.mock('@/lib/shared/config/features', () => ({
  isFeatureEnabled: vi.fn(() => false), // KYC disabled by default for tests
}))

// Mock Supabase server client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        in: vi.fn(() => ({
          select: vi.fn(),
        })),
      })),
      in: vi.fn(() => mockSupabase.from()),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
}

vi.mock('@/lib/shared/db/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

// Import after mocks
import { createAnnouncement, getActiveAnnouncementsCount } from '@/lib/core/announcements/actions'

describe('Announcements Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createAnnouncement', () => {
    const validAnnouncementData: CreateAnnouncementInput = {
      departure_country: 'France',
      departure_city: 'Paris',
      arrival_country: 'Bénin',
      arrival_city: 'Cotonou',
      departure_date: new Date('2025-03-01'),
      arrival_date: new Date('2025-03-02'),
      available_kg: 20,
      price_per_kg: 10,
      description: 'Test announcement',
    }

    test('successfully creates announcement with valid data', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      })

      // Mock profile query (KYC approved)
      const fromMock = vi.fn()
      fromMock.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: {
                  kyc_status: 'approved',
                  kyc_rejection_reason: null,
                },
                error: null,
              })
            ),
          })),
        })),
      })

      // Mock active announcements count (under limit)
      fromMock.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() =>
              Promise.resolve({
                data: [], // No active announcements
                error: null,
              })
            ),
          })),
        })),
      })

      // Mock announcement creation
      fromMock.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: { id: 'announcement-123' },
                error: null,
              })
            ),
          })),
        })),
      })

      mockSupabase.from = fromMock

      const result = await createAnnouncement(validAnnouncementData)

      expect(result.success).toBe(true)
      expect(result.announcementId).toBe('announcement-123')
      expect(result.message).toContain('créée avec succès')
    })

    test('requires authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await createAnnouncement(validAnnouncementData)

      expect(result.error).toContain('connecté')
      expect(result.success).toBeUndefined()
    })

    test('validates required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
        },
        error: null,
      })

      const invalidData = {
        ...validAnnouncementData,
        departure_city: '', // Invalid
      }

      const result = await createAnnouncement(invalidData)

      expect(result.error).toBeDefined()
    })

    test('enforces max active announcements limit', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
        },
        error: null,
      })

      const fromMock = vi.fn()

      // Mock profile query
      fromMock.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: { kyc_status: 'approved' },
                error: null,
              })
            ),
          })),
        })),
      })

      // Mock 10 active announcements (at limit)
      fromMock.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() =>
              Promise.resolve({
                data: Array(10).fill({ id: 'announcement' }),
                error: null,
              })
            ),
          })),
        })),
      })

      mockSupabase.from = fromMock

      const result = await createAnnouncement(validAnnouncementData)

      expect(result.error).toContain('limite')
      expect(result.field).toBe('limit')
    })

    test('validates departure date is before arrival date', async () => {
      // Mock auth - validation happens after auth check
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
        },
        error: null,
      })

      const fromMock = vi.fn()
      // Mock profile query
      fromMock.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: { kyc_status: 'approved' },
                error: null,
              })
            ),
          })),
        })),
      })

      // Mock active announcements count
      fromMock.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() =>
              Promise.resolve({
                data: [],
                error: null,
              })
            ),
          })),
        })),
      })

      mockSupabase.from = fromMock

      const invalidData = {
        ...validAnnouncementData,
        departure_date: new Date('2025-03-02'),
        arrival_date: new Date('2025-03-01'), // Before departure
      }

      const result = await createAnnouncement(invalidData)

      expect(result.error).toBeDefined()
    })

    test('validates available_kg is positive', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
        },
        error: null,
      })

      const fromMock = vi.fn()
      fromMock.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: { kyc_status: 'approved' },
                error: null,
              })
            ),
          })),
        })),
      })

      fromMock.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() =>
              Promise.resolve({
                data: [],
                error: null,
              })
            ),
          })),
        })),
      })

      mockSupabase.from = fromMock

      const invalidData = {
        ...validAnnouncementData,
        available_kg: -5, // Negative
      }

      const result = await createAnnouncement(invalidData)

      expect(result.error).toBeDefined()
    })

    test('validates price_per_kg is positive', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
        },
        error: null,
      })

      const fromMock = vi.fn()
      fromMock.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: { kyc_status: 'approved' },
                error: null,
              })
            ),
          })),
        })),
      })

      fromMock.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() =>
              Promise.resolve({
                data: [],
                error: null,
              })
            ),
          })),
        })),
      })

      mockSupabase.from = fromMock

      const invalidData = {
        ...validAnnouncementData,
        price_per_kg: 0, // Zero or negative
      }

      const result = await createAnnouncement(invalidData)

      expect(result.error).toBeDefined()
    })

    test('handles database errors gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
        },
        error: null,
      })

      const fromMock = vi.fn()

      // Mock profile query
      fromMock.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: { kyc_status: 'approved' },
                error: null,
              })
            ),
          })),
        })),
      })

      // Mock active announcements count
      fromMock.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() =>
              Promise.resolve({
                data: [],
                error: null,
              })
            ),
          })),
        })),
      })

      // Mock database error on insert
      fromMock.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: { message: 'Database error' },
              })
            ),
          })),
        })),
      })

      mockSupabase.from = fromMock

      const result = await createAnnouncement(validAnnouncementData)

      expect(result.error).toBeDefined()
      expect(result.success).toBeUndefined()
    })
  })

  describe('getActiveAnnouncementsCount', () => {
    test('returns count for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
        },
        error: null,
      })

      const fromMock = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() =>
              Promise.resolve({
                count: 3,
                error: null,
              })
            ),
          })),
        })),
      }))

      mockSupabase.from = fromMock

      const result = await getActiveAnnouncementsCount()

      expect(result.count).toBe(3)
      expect(result.maxAllowed).toBe(10)
      expect(result.error).toBeUndefined()
    })

    test('requires authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      const result = await getActiveAnnouncementsCount()

      expect(result.error).toContain('Non authentifié')
    })

    test('handles database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
        },
        error: null,
      })

      const fromMock = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() =>
              Promise.resolve({
                count: null,
                error: { message: 'Database error' },
              })
            ),
          })),
        })),
      }))

      mockSupabase.from = fromMock

      const result = await getActiveAnnouncementsCount()

      expect(result.error).toBeDefined()
    })
  })
})
