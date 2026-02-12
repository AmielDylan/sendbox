'use server'

export type FedaPayOperator =
  | 'mtn_open'
  | 'mtn'
  | 'moov'
  | 'sbin'
  | 'celtiis'
  | 'togocom'
  | 'wave'
  | 'orange'
  | 'mtn_guinea'

export type FedaPayPaymentMethod = {
  id?: number
  name?: string
  code?: string
  mode?: string
  provider?: string
}

export type FedaPayCountry = {
  code: string
  name?: string
}

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
  countryCode?: string
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

const FALLBACK_FEDAPAY_COUNTRIES = [
  'BJ',
  'SN',
  'BF',
  'CI',
  'TG',
  'NE',
  'GN',
  'ML',
] as const
const FALLBACK_FEDAPAY_COUNTRY_LABELS: Record<string, string> = {
  BJ: 'Bénin',
  SN: 'Sénégal',
  BF: 'Burkina Faso',
  CI: 'Côte d’Ivoire',
  TG: 'Togo',
  NE: 'Niger',
  GN: 'Guinée',
  ML: 'Mali',
}
const FALLBACK_FEDAPAY_METHODS_BY_COUNTRY: Record<
  string,
  { code: string; name: string }[]
> = {
  BJ: [
    { code: 'mtn', name: 'MTN Mobile Money' },
    { code: 'moov', name: 'Moov Money' },
    { code: 'celtiis', name: 'Celtiis' },
  ],
  TG: [
    { code: 'moov', name: 'Moov' },
    { code: 'togocom', name: 'TogoCom' },
  ],
  GN: [{ code: 'mtn_guinea', name: 'MTN Guinea' }],
  CI: [
    { code: 'mtn', name: 'MTN' },
    { code: 'moov', name: 'Moov' },
    { code: 'wave', name: 'Wave' },
    { code: 'orange', name: 'Orange' },
  ],
  SN: [
    { code: 'wave', name: 'Wave' },
    { code: 'orange', name: 'Orange' },
  ],
  BF: [
    { code: 'moov', name: 'Moov' },
    { code: 'orange', name: 'Orange' },
  ],
}

const MODE_LABELS: Record<string, string> = {
  mtn: 'MTN Mobile Money',
  mtn_open: 'MTN Mobile Money',
  moov: 'Moov Money',
  sbin: 'Celtiis',
  celtiis: 'Celtiis',
  togocom: 'TogoCom',
  togocel: 'TogoCom',
  wave: 'Wave',
  wave_sn: 'Wave',
  wave_ci: 'Wave',
  wave_direct_ci: 'Wave',
  wave_ci_hub: 'Wave',
  orange: 'Orange Money',
  orange_ci: 'Orange Money',
  orange_sn: 'Orange Money',
  orange_bf: 'Orange Money',
  orange_ml: 'Orange Money',
  moov_ci: 'Moov Money',
  moov_tg: 'Moov Money',
  moov_bf: 'Moov Money',
  mtn_ci: 'MTN Mobile Money',
  mtn_open_ci: 'MTN Mobile Money',
  mtn_ecw: 'MTN Mobile Money',
}

const MODE_ALIASES: Record<string, string> = {
  mtn_open: 'mtn',
  mtn_open_ci: 'mtn',
  mtn_ci: 'mtn',
  mtn_ecw: 'mtn',
  moov_ci: 'moov',
  moov_tg: 'moov',
  moov_bf: 'moov',
  orange_ci: 'orange',
  orange_sn: 'orange',
  orange_bf: 'orange',
  orange_ml: 'orange',
  wave_ci: 'wave',
  wave_sn: 'wave',
  wave_direct_ci: 'wave',
  wave_ci_hub: 'wave',
  sbin: 'celtiis',
  celtiis: 'celtiis',
  togocel: 'togocom',
}

const FEDAPAY_DIAL_CODES: Record<string, string> = {
  BJ: '229',
  SN: '221',
  BF: '226',
  CI: '225',
  TG: '228',
  NE: '227',
  GN: '224',
  ML: '223',
}

const normalizePhone = (input: string) =>
  input.replace(/\s|\(|\)|\.|-/g, '').replace(/^\+/, '')

const stripCountryPrefix = (input: string, countryCode?: string) => {
  const normalized = input
  if (!countryCode) return normalized
  const dialCode = FEDAPAY_DIAL_CODES[countryCode.toUpperCase()]
  if (dialCode && normalized.startsWith(dialCode)) {
    return normalized.slice(dialCode.length)
  }
  return normalized
}

const isValidSbin = (phone: string) => phone.startsWith('01')
const isCeltiisOperator = (operator: string) =>
  /sbin|celtiis|celtis/i.test(operator)

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

const extractErrorMessage = (payload: any) =>
  payload?.message ||
  payload?.error ||
  payload?.errors?.[0]?.message ||
  'Erreur FedaPay'

const getHeaders = () => {
  const apiKey = process.env.FEDAPAY_SECRET_KEY
  if (!apiKey) {
    throw new Error('Clé FedaPay manquante')
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
}

async function fedapayGet(path: string) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers: getHeaders(),
  })
  return parseResponse(res)
}

const normalizeMode = (mode: string) => {
  const normalized = mode.toLowerCase().trim()
  return MODE_ALIASES[normalized] || normalized
}

const titleize = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase())

const extractCurrencies = (payload: any) => {
  if (!payload) return null
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.currencies)) return payload.currencies
  if (Array.isArray(payload?.['v1/currencies'])) return payload['v1/currencies']
  return null
}

export async function listFedaPayCountries(): Promise<{
  data: FedaPayCountry[]
  source: 'api' | 'fallback'
}> {
  try {
    const payload = await fedapayGet('/countries')
    const data = Array.isArray(payload) ? payload : payload?.countries
    const normalized = (data || [])
      .map((item: any) => ({
        code: String(item?.code || item?.iso || item?.country || '')
          .toUpperCase()
          .trim(),
        name: item?.name || item?.label || undefined,
      }))
      .filter((item: FedaPayCountry) => item.code)

    if (normalized.length) {
      return { data: normalized, source: 'api' }
    }
  } catch (error) {
    console.warn('FedaPay countries API unavailable:', error)
  }

  return {
    data: FALLBACK_FEDAPAY_COUNTRIES.map(code => ({
      code,
      name: FALLBACK_FEDAPAY_COUNTRY_LABELS[code] || undefined,
    })),
    source: 'fallback',
  }
}

export async function listFedaPayPaymentMethods(country?: string): Promise<{
  data: FedaPayPaymentMethod[]
  source: 'api' | 'fallback'
}> {
  try {
    const payload = await fedapayGet('/payment-methods')
    const data = Array.isArray(payload) ? payload : payload?.payment_methods
    const normalized = (data || [])
      .map((item: any) => ({
        id: item?.id,
        name: item?.name || item?.label || item?.provider,
        code: item?.code || item?.provider || item?.mode,
        mode: item?.mode,
        provider: item?.provider,
      }))
      .filter((item: FedaPayPaymentMethod) => item.code || item.name)

    if (normalized.length) {
      return { data: normalized, source: 'api' }
    }
  } catch (error) {
    console.warn('FedaPay payment methods API unavailable:', error)
  }

  try {
    const payload = await fedapayGet('/currencies')
    const currencies = extractCurrencies(payload)
    const currency =
      currencies?.find((item: any) => item?.iso === 'XOF') ||
      currencies?.find((item: any) => item?.name === 'FCFA') ||
      currencies?.find((item: any) => item?.default) ||
      currencies?.[0]
    const modes = Array.isArray(currency?.modes) ? currency.modes : []

    const allowedCodes = country
      ? (FALLBACK_FEDAPAY_METHODS_BY_COUNTRY[country.toUpperCase()] || []).map(
          item => item.code
        )
      : null

    const normalized = (
      Array.from(
        new Set(
          modes
            .map((mode: string) => normalizeMode(mode))
            .filter((mode: string) =>
              allowedCodes ? allowedCodes.includes(mode) : true
            )
        )
      ) as string[]
    ).map(code => ({
      code,
      name: MODE_LABELS[code] || titleize(code),
    }))

    if (normalized.length) {
      return { data: normalized, source: 'api' }
    }
  } catch (error) {
    console.warn('FedaPay currencies API unavailable:', error)
  }

  if (country) {
    const upper = country.toUpperCase()
    if (!FALLBACK_FEDAPAY_METHODS_BY_COUNTRY[upper]) {
      return { data: [], source: 'fallback' }
    }
    return {
      data: FALLBACK_FEDAPAY_METHODS_BY_COUNTRY[upper].map(item => ({
        ...item,
      })),
      source: 'fallback',
    }
  }

  return {
    data: FALLBACK_FEDAPAY_METHODS_BY_COUNTRY.BJ.map(item => ({ ...item })),
    source: 'fallback',
  }
}

export async function createFedaPayPayout(
  input: FedaPayPayoutInput
): Promise<FedaPayPayoutResult> {
  const apiKey = process.env.FEDAPAY_SECRET_KEY
  const normalized = stripCountryPrefix(
    normalizePhone(input.phoneNumber),
    input.countryCode
  )
  const countryCode = (input.countryCode || 'BJ').toUpperCase()
  const dialCode = FEDAPAY_DIAL_CODES[countryCode] || '229'
  const providerMap: Record<string, string> = {
    mtn_open: 'mtn',
    mtn: 'mtn',
    moov: 'moov',
    sbin: 'sbin',
    celtiis: 'sbin',
    togocom: 'togocom',
    wave: 'wave',
    orange: 'orange',
    mtn_guinea: 'mtn_guinea',
  }

  if (isCeltiisOperator(input.operator) && !isValidSbin(normalized)) {
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
    : `+${dialCode}${normalized}`

  const buildReceiverPayload = () => {
    const payload: Record<string, any> = {
      amount: input.amount,
      currency: { iso: input.currency || DEFAULT_CURRENCY },
      description: input.description,
      callback_url: input.callbackUrl,
      receiver: {
        name: receiverName,
        phone_number: phoneWithCountry,
        provider: providerMap[input.operator] || input.operator,
      },
    }

    if (input.metadata) {
      payload.custom_metadata = input.metadata
    }

    if (input.reference) {
      payload.merchant_reference = input.reference
    }

    return payload
  }

  const buildRecipientPayload = () => {
    const payload: Record<string, any> = {
      amount: input.amount,
      currency: { iso: input.currency || DEFAULT_CURRENCY },
      description: input.description,
      callback_url: input.callbackUrl,
      recipient: {
        name: receiverName,
        phone_number: {
          number: normalized,
          country: countryCode.toLowerCase(),
        },
      },
    }

    if (input.customer) {
      payload.customer = {
        firstname: input.customer.firstname,
        lastname: input.customer.lastname,
        email: input.customer.email,
        phone_number: input.customer.phoneNumber
          ? {
              number: stripCountryPrefix(
                normalizePhone(input.customer.phoneNumber),
                input.countryCode
              ),
              country: countryCode.toLowerCase(),
            }
          : undefined,
      }
    }

    if (input.reference) {
      payload.merchant_reference = input.reference
    }

    if (input.metadata) {
      payload.custom_metadata = input.metadata
    }

    return payload
  }

  const payoutRes = await fetch(`${baseUrl}/payouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildReceiverPayload()),
  })

  let payoutData: any = await payoutRes.json().catch(() => ({}))
  let payout = payoutData?.payout || payoutData?.data || payoutData
  if (!payoutRes.ok) {
    const message = extractErrorMessage(payoutData)
    const shouldRetry = /recipient|phone_number|mode|customer/i.test(
      message || ''
    )
    if (!shouldRetry) {
      throw new Error(message)
    }

    const retryRes = await fetch(`${baseUrl}/payouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildRecipientPayload()),
    })

    payoutData = await parseResponse(retryRes)
    payout = payoutData?.payout || payoutData?.data || payoutData
  }

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
