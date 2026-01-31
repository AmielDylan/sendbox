'use server'

export type FedaPayOperator = 'mtn_open' | 'moov' | 'sbin'

export type FedaPayCustomer = {
  id?: string
  email?: string
  firstname?: string
  lastname?: string
  phoneNumber?: string
}

export type FedaPayPayoutInput = {
  amount: number
  currency?: string
  operator: FedaPayOperator
  phoneNumber: string
  receiverName?: string
  description?: string
  reference?: string
  customer?: FedaPayCustomer
  metadata?: Record<string, string>
  callbackUrl?: string
  sendNow?: boolean
  scheduledAt?: string
}

export type FedaPayPayoutResult = {
  id: string
  status: string
  mode?: string
  amount?: number
  currency?: string
  reference?: string
  data?: unknown
}

const DEFAULT_CURRENCY = 'XOF'

const normalizePhone = (input: string) =>
  input.replace(/\s|\(|\)|\.|-/g, '').replace(/^\+/, '')

const stripCountryPrefix = (input: string) =>
  input.startsWith('229') ? input.slice(3) : input

const isValidSbin = (phone: string) => phone.startsWith('01')

const getBaseUrl = () => {
  const env = process.env.FEDAPAY_ENV || 'sandbox'
  if (process.env.FEDAPAY_BASE_URL) return process.env.FEDAPAY_BASE_URL
  return env === 'live'
    ? 'https://api.fedapay.com/v1'
    : 'https://sandbox-api.fedapay.com/v1'
}

const parseResponse = async (res: Response) => {
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      payload?.errors?.[0]?.message ||
      'Erreur FedaPay'
    throw new Error(message)
  }
  return payload
}

export async function createFedaPayPayout(
  input: FedaPayPayoutInput
): Promise<FedaPayPayoutResult> {
  const apiKey = process.env.FEDAPAY_SECRET_KEY
  const normalized = stripCountryPrefix(normalizePhone(input.phoneNumber))
  const providerMap: Record<FedaPayOperator, string> = {
    mtn_open: 'mtn',
    moov: 'moov',
    sbin: 'sbin',
  }

  if (input.operator === 'sbin' && !isValidSbin(normalized)) {
    throw new Error('Le numéro Celtis doit commencer par 01')
  }

  if (!apiKey && process.env.NODE_ENV !== 'production') {
    return {
      id: `dev_${Date.now()}`,
      status: 'pending',
      mode: input.operator,
      amount: input.amount,
      currency: input.currency || DEFAULT_CURRENCY,
      reference: input.reference,
      data: { simulated: true },
    }
  }

  if (!apiKey) {
    throw new Error('Clé FedaPay manquante')
  }

  const baseUrl = getBaseUrl()
  const receiverName =
    input.receiverName ||
    [input.customer?.firstname, input.customer?.lastname]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    'Utilisateur Sendbox'
  const phoneWithCountry = input.phoneNumber.startsWith('+')
    ? input.phoneNumber
    : `+229${normalized}`

  const payoutPayload: Record<string, any> = {
    amount: input.amount,
    currency: { iso: input.currency || DEFAULT_CURRENCY },
    description: input.description,
    callback_url: input.callbackUrl,
    receiver: {
      name: receiverName,
      phone_number: phoneWithCountry,
      provider: providerMap[input.operator],
    },
  }

  if (input.metadata) {
    payoutPayload.custom_metadata = input.metadata
  }

  if (input.reference) {
    payoutPayload.merchant_reference = input.reference
  }

  const payoutRes = await fetch(`${baseUrl}/payouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payoutPayload),
  })

  const payoutData = await parseResponse(payoutRes)
  const payout = payoutData?.payout || payoutData?.data || payoutData

  if (input.sendNow && payout?.id) {
    const startRes = await fetch(`${baseUrl}/payouts/start`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payouts: [
          {
            id: payout.id,
            scheduled_at: input.scheduledAt || null,
          },
        ],
      }),
    })

    const startData = await parseResponse(startRes)
    return {
      id: payout.id,
      status: startData?.status || payout?.status || 'started',
      mode: payout?.mode,
      amount: payout?.amount,
      currency: payout?.currency,
      reference: payout?.reference,
      data: startData,
    }
  }

  return {
    id: payout?.id,
    status: payout?.status || 'pending',
    mode: payout?.mode,
    amount: payout?.amount,
    currency: payout?.currency,
    reference: payout?.reference,
    data: payoutData,
  }
}
