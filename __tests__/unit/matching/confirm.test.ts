import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  state: {
    profile: { is_suspended: false } as any,
    booking: null as any,
    updatedBooking: null as any,
    existingPayment: null as any,
    bookingSelectCount: 0,
    bookingUpdates: [] as any[],
    matchingInserts: [] as any[],
  },
  paymentIntentsCreate: vi.fn(),
  runAntiCollusionChecks: vi.fn(),
}))

vi.mock('@/lib/shared/db/admin', () => {
  class QueryBuilder {
    constructor(private readonly table: string) {}

    select() {
      return this
    }

    eq() {
      return this
    }

    in() {
      return this
    }

    update(values: Record<string, unknown>) {
      if (this.table === 'bookings') {
        mocks.state.bookingUpdates.push(values)
        mocks.state.updatedBooking = {
          ...(mocks.state.updatedBooking || mocks.state.booking),
          ...values,
        }
      }

      return this
    }

    insert(values: Record<string, unknown>) {
      if (this.table === 'matching_payments') {
        mocks.state.matchingInserts.push(values)
      }

      return Promise.resolve({ data: null, error: null })
    }

    single() {
      if (this.table === 'profiles') {
        return Promise.resolve({ data: mocks.state.profile, error: null })
      }

      if (this.table === 'bookings') {
        const data =
          mocks.state.bookingSelectCount === 0
            ? mocks.state.booking
            : mocks.state.updatedBooking || mocks.state.booking
        mocks.state.bookingSelectCount += 1
        return Promise.resolve({ data, error: null })
      }

      return Promise.resolve({ data: null, error: null })
    }

    maybeSingle() {
      if (this.table === 'matching_payments') {
        return Promise.resolve({
          data: mocks.state.existingPayment,
          error: null,
        })
      }

      return Promise.resolve({ data: null, error: null })
    }
  }

  return {
    createAdminClient: () => ({
      from: (table: string) => new QueryBuilder(table),
    }),
  }
})

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(function Stripe() {
    return {
      paymentIntents: {
        create: mocks.paymentIntentsCreate,
      },
    }
  }),
}))

vi.mock('@/lib/trust/anti-collusion', () => ({
  runAntiCollusionChecks: mocks.runAntiCollusionChecks,
}))

import { confirmMatchingForBooking } from '@/lib/core/matching/confirm'

const originalStripeSecret = process.env.STRIPE_SECRET_KEY

function seedBooking(overrides: Record<string, unknown> = {}) {
  mocks.state.booking = {
    id: 'booking-1',
    sender_id: 'sender-1',
    traveler_id: 'traveler-1',
    status: 'accepted',
    sender_confirmed_at: null,
    traveler_confirmed_at: null,
    status_history: [],
    duration_hours: 6,
    ...overrides,
  }
  mocks.state.updatedBooking = { ...mocks.state.booking }
}

beforeEach(() => {
  mocks.state.profile = { is_suspended: false }
  mocks.state.booking = null
  mocks.state.updatedBooking = null
  mocks.state.existingPayment = null
  mocks.state.bookingSelectCount = 0
  mocks.state.bookingUpdates = []
  mocks.state.matchingInserts = []
  mocks.paymentIntentsCreate.mockReset()
  mocks.runAntiCollusionChecks.mockReset()

  if (originalStripeSecret === undefined) {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
  } else {
    process.env.STRIPE_SECRET_KEY = originalStripeSecret
  }
})

describe('confirmMatchingForBooking', () => {
  it("enregistre la confirmation et attend l'autre partie", async () => {
    seedBooking()

    await expect(
      confirmMatchingForBooking('booking-1', 'sender-1')
    ).resolves.toMatchObject({
      status: 'WAITING_OTHER_PARTY',
    })

    expect(mocks.state.bookingUpdates[0]).toHaveProperty('sender_confirmed_at')
    expect(mocks.paymentIntentsCreate).not.toHaveBeenCalled()
  })

  it("prépare le paiement quand l'acceptation voyageur est déjà confirmée", async () => {
    seedBooking({ traveler_confirmed_at: '2026-07-13T10:00:00.000Z' })
    mocks.paymentIntentsCreate.mockResolvedValue({
      id: 'pi_matching_1',
      client_secret: 'pi_matching_secret_1',
      amount: 290,
      currency: 'eur',
    })

    await expect(
      confirmMatchingForBooking('booking-1', 'sender-1')
    ).resolves.toMatchObject({
      status: 'PAYMENT_REQUIRED',
      clientSecret: 'pi_matching_secret_1',
      amountCents: 290,
      mustPay: true,
    })

    expect(mocks.state.matchingInserts[0]).toMatchObject({
      booking_id: 'booking-1',
      stripe_payment_intent_id: 'pi_matching_1',
      stripe_client_secret: 'pi_matching_secret_1',
      amount_cents: 290,
      currency: 'eur',
      paid_by: 'sender-1',
    })
    expect(mocks.state.bookingUpdates.at(-1)).toMatchObject({
      status: 'payment_pending',
    })
    expect(mocks.runAntiCollusionChecks).toHaveBeenCalledWith(
      'booking-1',
      'traveler-1',
      6
    )
  })

  it('réutilise un paiement pending existant', async () => {
    seedBooking({
      sender_confirmed_at: '2026-07-13T10:00:00.000Z',
      traveler_confirmed_at: null,
    })
    mocks.state.existingPayment = {
      id: 'matching-payment-1',
      status: 'pending',
      stripe_client_secret: 'existing_secret',
      amount_cents: 290,
      paid_by: 'sender-1',
    }

    await expect(
      confirmMatchingForBooking('booking-1', 'traveler-1')
    ).resolves.toMatchObject({
      status: 'PAYMENT_ALREADY_INITIATED',
      clientSecret: 'existing_secret',
      amountCents: 290,
      mustPay: false,
    })

    expect(mocks.paymentIntentsCreate).not.toHaveBeenCalled()
  })

  it('confirme le booking si le paiement existant a déjà réussi', async () => {
    seedBooking({
      sender_confirmed_at: '2026-07-13T10:00:00.000Z',
      traveler_confirmed_at: null,
    })
    mocks.state.existingPayment = {
      id: 'matching-payment-1',
      status: 'succeeded',
      stripe_client_secret: 'existing_secret',
      amount_cents: 290,
      paid_by: 'sender-1',
    }

    await expect(
      confirmMatchingForBooking('booking-1', 'traveler-1')
    ).resolves.toMatchObject({
      status: 'ALREADY_CONFIRMED',
    })

    expect(mocks.state.bookingUpdates.at(-1)).toMatchObject({
      status: 'confirmed',
    })
    expect(mocks.paymentIntentsCreate).not.toHaveBeenCalled()
  })

  it('retourne une erreur 503 si Stripe est indisponible', async () => {
    seedBooking({ traveler_confirmed_at: '2026-07-13T10:00:00.000Z' })
    delete process.env.STRIPE_SECRET_KEY

    await expect(
      confirmMatchingForBooking('booking-1', 'sender-1')
    ).rejects.toMatchObject({
      message: 'Configuration paiement indisponible. Réessayez plus tard.',
      status: 503,
    })
  })
})
