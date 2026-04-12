import 'server-only'

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY
const FLUTTERWAVE_CLIENT_ID = process.env.FLUTTERWAVE_CLIENT_ID
const FLUTTERWAVE_CLIENT_SECRET = process.env.FLUTTERWAVE_CLIENT_SECRET

const hasOAuthCredentials = Boolean(
  FLUTTERWAVE_CLIENT_ID && FLUTTERWAVE_CLIENT_SECRET
)

const isTestKey =
  typeof FLUTTERWAVE_SECRET_KEY === 'string' &&
  (/test/i.test(FLUTTERWAVE_SECRET_KEY) ||
    /FLWSECK_TEST/i.test(FLUTTERWAVE_SECRET_KEY))

const rawBaseUrl =
  process.env.FLUTTERWAVE_BASE_URL ||
  (hasOAuthCredentials
    ? 'https://developersandbox-api.flutterwave.com'
    : isTestKey
      ? 'https://developersandbox-api.flutterwave.com/v3'
      : 'https://api.flutterwave.com/v3')

const FLUTTERWAVE_BASE_URL = rawBaseUrl.replace(/\/+$/, '')

if (
  !FLUTTERWAVE_SECRET_KEY &&
  !hasOAuthCredentials &&
  process.env.NODE_ENV !== 'test'
) {
  console.warn('⚠️ Flutterwave credentials are not configured')
}

type TokenCache = { token: string; expiresAt: number } | null
let tokenCache: TokenCache = null

const getAccessToken = async () => {
  if (
    !hasOAuthCredentials ||
    !FLUTTERWAVE_CLIENT_ID ||
    !FLUTTERWAVE_CLIENT_SECRET
  ) {
    throw new Error('Flutterwave OAuth credentials are missing')
  }

  const now = Date.now()
  if (tokenCache && tokenCache.expiresAt > now + 30_000) {
    return tokenCache.token
  }

  const params = new URLSearchParams({
    client_id: FLUTTERWAVE_CLIENT_ID,
    client_secret: FLUTTERWAVE_CLIENT_SECRET,
    grant_type: 'client_credentials',
  })

  const res = await fetch(
    'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    }
  )

  const data = (await res.json().catch(() => null)) as {
    access_token?: string
    expires_in?: number
  } | null

  if (!res.ok || !data?.access_token) {
    throw new Error('Impossible de générer le token Flutterwave')
  }

  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 600
  tokenCache = {
    token: data.access_token,
    expiresAt: now + expiresIn * 1000,
  }

  return data.access_token
}

const buildHeaders = async () => {
  const token = hasOAuthCredentials
    ? await getAccessToken()
    : FLUTTERWAVE_SECRET_KEY

  if (!token) {
    throw new Error('Flutterwave not configured')
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function flutterwaveRequest<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  if (!FLUTTERWAVE_SECRET_KEY && !hasOAuthCredentials) {
    throw new Error('Flutterwave not configured')
  }

  const headers = await buildHeaders()
  const res = await fetch(`${FLUTTERWAVE_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const data = (await res.json().catch(() => null)) as T | null
  if (!res.ok) {
    const message =
      (data as any)?.message ||
      (data as any)?.error ||
      `Flutterwave error (${res.status})`
    throw new Error(message)
  }

  return data as T
}

async function flutterwaveGet<T>(
  path: string,
  params: Record<string, string | undefined>
): Promise<T> {
  if (!FLUTTERWAVE_SECRET_KEY && !hasOAuthCredentials) {
    throw new Error('Flutterwave not configured')
  }

  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })

  const headers = await buildHeaders()
  const res = await fetch(
    `${FLUTTERWAVE_BASE_URL}${path}${query.toString() ? `?${query}` : ''}`,
    {
      method: 'GET',
      headers,
    }
  )

  const data = (await res.json().catch(() => null)) as T | null
  if (!res.ok) {
    const message =
      (data as any)?.message ||
      (data as any)?.error ||
      `Flutterwave error (${res.status})`
    throw new Error(message)
  }

  return data as T
}

export type FlutterwaveRecipientResponse = {
  status: string
  message: string
  data: {
    id: string
    type?: string
    currency?: string
    bank?: {
      account_number?: string
      code?: string
    }
  }
}

export type FlutterwaveListResponse<T> = {
  status: string
  message: string
  data: T[]
}

export type FlutterwaveBank = {
  id?: string
  code?: string
  name?: string
}

export type FlutterwaveMobileNetwork = {
  id?: string
  name?: string
  code?: string
  network?: string
}

export async function listFlutterwaveBanks(country: string) {
  return flutterwaveGet<FlutterwaveListResponse<FlutterwaveBank>>('/banks', {
    country,
  })
}

export async function listFlutterwaveMobileNetworks(country?: string) {
  return flutterwaveGet<FlutterwaveListResponse<FlutterwaveMobileNetwork>>(
    '/mobile-networks',
    { country }
  )
}

export async function createFlutterwaveBankRecipient(input: {
  type: string
  accountNumber: string
  bankCode: string
}) {
  return flutterwaveRequest<FlutterwaveRecipientResponse>(
    '/transfers/recipients',
    {
      type: input.type,
      bank: {
        account_number: input.accountNumber,
        code: input.bankCode,
      },
    }
  )
}

export type FlutterwaveTransferResponse = {
  id?: string
  status?: string
  message?: string
  data?: {
    id?: string
    status?: string
  }
}

export async function createFlutterwaveBankTransfer(input: {
  amount: number
  sourceCurrency: string
  destinationCurrency: string
  accountNumber: string
  bankCode: string
  accountName: string
  narration?: string
  reference?: string
}) {
  return flutterwaveRequest<FlutterwaveTransferResponse>('/transfers', {
    action: 'instant',
    type: 'bank',
    payment_instruction: {
      amount: input.amount,
      currency: {
        source_currency: input.sourceCurrency,
        destination_currency: input.destinationCurrency,
      },
      recipient_details: {
        account_number: input.accountNumber,
        bank_code: input.bankCode,
        account_name: input.accountName,
      },
    },
    narration: input.narration,
    reference: input.reference,
  })
}

export async function createFlutterwaveMobileMoneyTransfer(input: {
  amount: number
  sourceCurrency: string
  destinationCurrency: string
  phoneNumber: string
  network: string
  narration?: string
  reference?: string
}) {
  return flutterwaveRequest<FlutterwaveTransferResponse>('/transfers', {
    action: 'instant',
    type: 'mobile_money',
    payment_instruction: {
      amount: input.amount,
      source_currency: input.sourceCurrency,
      destination_currency: input.destinationCurrency,
      recipient_phone_number: input.phoneNumber,
      mobile_network: input.network,
    },
    narration: input.narration,
    reference: input.reference,
  })
}
