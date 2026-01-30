import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

/**
 * MSW Handlers pour mocker Stripe API
 * Ces handlers interceptent les appels vers l'API Stripe pour les paiements
 */

// Store en mémoire pour les objets Stripe
const mockStripeStore = {
  paymentIntents: new Map<string, any>(),
  customers: new Map<string, any>(),
  charges: new Map<string, any>(),
  transfers: new Map<string, any>(),
}

export const stripeHandlers = [
  // Create Payment Intent
  http.post(
    'https://api.stripe.com/v1/payment_intents',
    async ({ request }) => {
      const formData = await request.text()
      const params = new URLSearchParams(formData)

      const amount = params.get('amount')
      const currency = params.get('currency') || 'eur'
      const metadata = Object.fromEntries(
        Array.from(params.entries()).filter(([key]) =>
          key.startsWith('metadata[')
        )
      )

      const paymentIntentId = `pi_test_${faker.string.alphanumeric(24)}`
      const clientSecret = `${paymentIntentId}_secret_${faker.string.alphanumeric(32)}`

      const paymentIntent = {
        id: paymentIntentId,
        object: 'payment_intent',
        amount: parseInt(amount || '0'),
        amount_capturable: 0,
        amount_received: 0,
        application: null,
        application_fee_amount: null,
        automatic_payment_methods: null,
        canceled_at: null,
        cancellation_reason: null,
        capture_method: 'automatic',
        charges: {
          object: 'list',
          data: [],
          has_more: false,
          total_count: 0,
          url: `/v1/charges?payment_intent=${paymentIntentId}`,
        },
        client_secret: clientSecret,
        confirmation_method: 'automatic',
        created: Math.floor(Date.now() / 1000),
        currency,
        customer: null,
        description: null,
        invoice: null,
        last_payment_error: null,
        latest_charge: null,
        livemode: false,
        metadata,
        next_action: null,
        on_behalf_of: null,
        payment_method: null,
        payment_method_options: {},
        payment_method_types: ['card'],
        processing: null,
        receipt_email: null,
        review: null,
        setup_future_usage: null,
        shipping: null,
        source: null,
        statement_descriptor: null,
        statement_descriptor_suffix: null,
        status: 'requires_payment_method',
        transfer_data: null,
        transfer_group: null,
      }

      mockStripeStore.paymentIntents.set(paymentIntentId, paymentIntent)

      return HttpResponse.json(paymentIntent, { status: 200 })
    }
  ),

  // Retrieve Payment Intent
  http.get(
    'https://api.stripe.com/v1/payment_intents/:id',
    async ({ params }) => {
      const id = params.id as string
      const paymentIntent = mockStripeStore.paymentIntents.get(id)

      if (!paymentIntent) {
        return HttpResponse.json(
          {
            error: {
              type: 'invalid_request_error',
              message: `No such payment_intent: '${id}'`,
            },
          },
          { status: 404 }
        )
      }

      return HttpResponse.json(paymentIntent, { status: 200 })
    }
  ),

  // Confirm Payment Intent
  http.post(
    'https://api.stripe.com/v1/payment_intents/:id/confirm',
    async ({ params }) => {
      const id = params.id as string
      const paymentIntent = mockStripeStore.paymentIntents.get(id)

      if (!paymentIntent) {
        return HttpResponse.json(
          {
            error: {
              type: 'invalid_request_error',
              message: `No such payment_intent: '${id}'`,
            },
          },
          { status: 404 }
        )
      }

      // Simuler un paiement réussi
      const chargeId = `ch_test_${faker.string.alphanumeric(24)}`
      const updatedPaymentIntent = {
        ...paymentIntent,
        status: 'succeeded',
        amount_received: paymentIntent.amount,
        latest_charge: chargeId,
        charges: {
          ...paymentIntent.charges,
          data: [
            {
              id: chargeId,
              object: 'charge',
              amount: paymentIntent.amount,
              amount_captured: paymentIntent.amount,
              amount_refunded: 0,
              balance_transaction: `txn_${faker.string.alphanumeric(24)}`,
              captured: true,
              created: Math.floor(Date.now() / 1000),
              currency: paymentIntent.currency,
              paid: true,
              status: 'succeeded',
            },
          ],
          total_count: 1,
        },
      }

      mockStripeStore.paymentIntents.set(id, updatedPaymentIntent)

      return HttpResponse.json(updatedPaymentIntent, { status: 200 })
    }
  ),

  // Cancel Payment Intent
  http.post(
    'https://api.stripe.com/v1/payment_intents/:id/cancel',
    async ({ params }) => {
      const id = params.id as string
      const paymentIntent = mockStripeStore.paymentIntents.get(id)

      if (!paymentIntent) {
        return HttpResponse.json(
          {
            error: {
              type: 'invalid_request_error',
              message: `No such payment_intent: '${id}'`,
            },
          },
          { status: 404 }
        )
      }

      const updatedPaymentIntent = {
        ...paymentIntent,
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000),
        cancellation_reason: 'requested_by_customer',
      }

      mockStripeStore.paymentIntents.set(id, updatedPaymentIntent)

      return HttpResponse.json(updatedPaymentIntent, { status: 200 })
    }
  ),

  // Create Transfer (pour escrow)
  http.post('https://api.stripe.com/v1/transfers', async ({ request }) => {
    const formData = await request.text()
    const params = new URLSearchParams(formData)

    const amount = params.get('amount')
    const currency = params.get('currency') || 'eur'
    const destination = params.get('destination')

    const transferId = `tr_test_${faker.string.alphanumeric(24)}`

    const transfer = {
      id: transferId,
      object: 'transfer',
      amount: parseInt(amount || '0'),
      amount_reversed: 0,
      balance_transaction: `txn_${faker.string.alphanumeric(24)}`,
      created: Math.floor(Date.now() / 1000),
      currency,
      description: null,
      destination,
      destination_payment: `py_${faker.string.alphanumeric(24)}`,
      livemode: false,
      metadata: {},
      reversals: {
        object: 'list',
        data: [],
        has_more: false,
        total_count: 0,
      },
      reversed: false,
      source_transaction: null,
      source_type: 'card',
      transfer_group: null,
    }

    mockStripeStore.transfers.set(transferId, transfer)

    return HttpResponse.json(transfer, { status: 200 })
  }),

  // Create Customer
  http.post('https://api.stripe.com/v1/customers', async ({ request }) => {
    const formData = await request.text()
    const params = new URLSearchParams(formData)

    const email = params.get('email')
    const metadata = Object.fromEntries(
      Array.from(params.entries()).filter(([key]) =>
        key.startsWith('metadata[')
      )
    )

    const customerId = `cus_test_${faker.string.alphanumeric(14)}`

    const customer = {
      id: customerId,
      object: 'customer',
      address: null,
      balance: 0,
      created: Math.floor(Date.now() / 1000),
      currency: null,
      default_source: null,
      delinquent: false,
      description: null,
      discount: null,
      email,
      invoice_prefix: faker.string.alphanumeric(8).toUpperCase(),
      invoice_settings: {
        custom_fields: null,
        default_payment_method: null,
        footer: null,
      },
      livemode: false,
      metadata,
      name: null,
      phone: null,
      preferred_locales: [],
      shipping: null,
      tax_exempt: 'none',
    }

    mockStripeStore.customers.set(customerId, customer)

    return HttpResponse.json(customer, { status: 200 })
  }),

  // Webhook events (simulation)
  http.post('https://api.stripe.com/v1/events', async ({ request }) => {
    const body = (await request.json()) as any

    return HttpResponse.json(
      {
        id: `evt_test_${faker.string.alphanumeric(24)}`,
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        data: body.data || {},
        livemode: false,
        pending_webhooks: 0,
        request: {
          id: `req_${faker.string.alphanumeric(14)}`,
          idempotency_key: null,
        },
        type: body.type || 'payment_intent.succeeded',
      },
      { status: 200 }
    )
  }),
]

// Fonction helper pour réinitialiser le store Stripe
export function resetMockStripeStore() {
  Object.values(mockStripeStore).forEach(store => store.clear())
}

// Fonction helper pour pré-remplir des données Stripe de test
export function seedMockStripeStore(
  type: keyof typeof mockStripeStore,
  data: any[]
) {
  data.forEach(record => {
    mockStripeStore[type].set(record.id, record)
  })
}
