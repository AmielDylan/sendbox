import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import Stripe from 'stripe'

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  state: {
    payment: { booking_id: 'booking-1' } as { booking_id: string } | null,
    matchingPaymentUpdates: [] as Record<string, unknown>[],
    bookingUpdates: [] as Record<string, unknown>[],
    matchingPaymentFilters: [] as Array<[string, unknown]>,
    bookingFilters: [] as Array<[string, unknown]>,
  },
}))

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(function Stripe() {
    return {
      webhooks: {
        constructEvent: mocks.constructEvent,
      },
    }
  }),
}))

vi.mock('@/lib/shared/db/admin', () => {
  class QueryBuilder {
    constructor(private readonly table: string) {}

    update(values: Record<string, unknown>) {
      if (this.table === 'matching_payments') {
        mocks.state.matchingPaymentUpdates.push(values)
      }

      if (this.table === 'bookings') {
        mocks.state.bookingUpdates.push(values)
      }

      return this
    }

    eq(column: string, value: unknown) {
      if (this.table === 'matching_payments') {
        mocks.state.matchingPaymentFilters.push([column, value])
      }

      if (this.table === 'bookings') {
        mocks.state.bookingFilters.push([column, value])
      }

      return this
    }

    in(column: string, value: unknown) {
      if (this.table === 'matching_payments') {
        mocks.state.matchingPaymentFilters.push([column, value])
      }

      if (this.table === 'bookings') {
        mocks.state.bookingFilters.push([column, value])
      }

      return this
    }

    select() {
      return this
    }

    single() {
      return Promise.resolve({ data: mocks.state.payment, error: null })
    }
  }

  return {
    createAdminClient: () => ({
      from: (table: string) => new QueryBuilder(table),
    }),
  }
})

import { POST } from '@/app/api/webhooks/stripe/route'

const originalStripeSecret = process.env.STRIPE_SECRET_KEY
const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

function createRequest(signature: string | null = 'stripe-signature') {
  return new Request('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    headers: signature ? { 'stripe-signature': signature } : undefined,
    body: JSON.stringify({ id: 'evt_1' }),
  }) as never
}

function createPaymentIntentEvent(
  type: 'payment_intent.succeeded' | 'payment_intent.payment_failed',
  id = 'pi_matching_1'
): Stripe.Event {
  return {
    id: `evt_${type}`,
    object: 'event',
    api_version: '2026-03-25.dahlia',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id,
        object: 'payment_intent',
      } as Stripe.PaymentIntent,
    },
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type,
  }
}

beforeEach(() => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock'

  mocks.constructEvent.mockReset()
  mocks.state.payment = { booking_id: 'booking-1' }
  mocks.state.matchingPaymentUpdates = []
  mocks.state.bookingUpdates = []
  mocks.state.matchingPaymentFilters = []
  mocks.state.bookingFilters = []
})

afterAll(() => {
  if (originalStripeSecret === undefined) delete process.env.STRIPE_SECRET_KEY
  else process.env.STRIPE_SECRET_KEY = originalStripeSecret

  if (originalWebhookSecret === undefined) {
    delete process.env.STRIPE_WEBHOOK_SECRET
  } else {
    process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret
  }
})

describe('POST /api/webhooks/stripe', () => {
  it('rejette une configuration webhook incomplete', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET

    const response = await POST(createRequest())

    await expect(response.json()).resolves.toEqual({
      error: 'Configuration webhook invalide',
    })
    expect(response.status).toBe(400)
    expect(mocks.constructEvent).not.toHaveBeenCalled()
  })

  it('rejette une requete sans signature Stripe', async () => {
    const response = await POST(createRequest(null))

    await expect(response.json()).resolves.toEqual({
      error: 'Configuration webhook invalide',
    })
    expect(response.status).toBe(400)
    expect(mocks.constructEvent).not.toHaveBeenCalled()
  })

  it('rejette une signature invalide', async () => {
    mocks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const response = await POST(createRequest())

    await expect(response.json()).resolves.toEqual({
      error: 'Invalid signature',
    })
    expect(response.status).toBe(400)
  })

  it('marque le paiement reussi et confirme le booking payment_pending', async () => {
    mocks.constructEvent.mockReturnValue(
      createPaymentIntentEvent('payment_intent.succeeded')
    )

    const response = await POST(createRequest())

    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(response.status).toBe(200)
    expect(mocks.state.matchingPaymentUpdates).toEqual([
      { status: 'succeeded' },
    ])
    expect(mocks.state.matchingPaymentFilters).toContainEqual([
      'stripe_payment_intent_id',
      'pi_matching_1',
    ])
    expect(mocks.state.bookingUpdates).toEqual([{ status: 'confirmed' }])
    expect(mocks.state.bookingFilters).toContainEqual(['id', 'booking-1'])
    expect(mocks.state.bookingFilters).toContainEqual([
      'status',
      'payment_pending',
    ])
  })

  it('ignore un PaymentIntent reussi inconnu sans confirmer de booking', async () => {
    mocks.state.payment = null
    mocks.constructEvent.mockReturnValue(
      createPaymentIntentEvent('payment_intent.succeeded', 'pi_unknown')
    )

    const response = await POST(createRequest())

    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(response.status).toBe(200)
    expect(mocks.state.matchingPaymentUpdates).toEqual([
      { status: 'succeeded' },
    ])
    expect(mocks.state.bookingUpdates).toEqual([])
  })

  it('marque uniquement un paiement pending en failed', async () => {
    mocks.constructEvent.mockReturnValue(
      createPaymentIntentEvent('payment_intent.payment_failed')
    )

    const response = await POST(createRequest())

    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(response.status).toBe(200)
    expect(mocks.state.matchingPaymentUpdates).toEqual([{ status: 'failed' }])
    expect(mocks.state.matchingPaymentFilters).toContainEqual([
      'stripe_payment_intent_id',
      'pi_matching_1',
    ])
    expect(mocks.state.matchingPaymentFilters).toContainEqual([
      'status',
      ['pending'],
    ])
    expect(mocks.state.bookingUpdates).toEqual([])
  })
})
