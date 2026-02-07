/**
 * Stripe Connect supported countries for Custom/Express connected accounts.
 * Source: https://stripe.com/docs/connect/accounts
 */

export const STRIPE_CONNECT_SUPPORTED_COUNTRIES = [
  'AE',
  'AG',
  'AL',
  'AM',
  'AR',
  'AT',
  'AU',
  'BA',
  'BE',
  'BG',
  'BH',
  'BJ',
  'BN',
  'BO',
  'BS',
  'BW',
  'CA',
  'CH',
  'CI',
  'CL',
  'CO',
  'CR',
  'CY',
  'CZ',
  'DE',
  'DK',
  'DO',
  'EC',
  'EE',
  'EG',
  'ES',
  'ET',
  'FI',
  'FR',
  'GB',
  'GH',
  'GM',
  'GR',
  'GT',
  'GY',
  'HK',
  'HU',
  'IE',
  'IL',
  'IS',
  'IT',
  'JM',
  'JO',
  'JP',
  'KE',
  'KH',
  'KR',
  'KW',
  'LC',
  'LK',
  'LT',
  'LU',
  'LV',
  'MA',
  'MC',
  'MD',
  'MG',
  'MK',
  'MN',
  'MO',
  'MT',
  'MU',
  'MX',
  'NA',
  'NG',
  'NL',
  'NO',
  'NZ',
  'OM',
  'PA',
  'PE',
  'PH',
  'PK',
  'PL',
  'PT',
  'PY',
  'QA',
  'RO',
  'RS',
  'RW',
  'SA',
  'SE',
  'SG',
  'SI',
  'SK',
  'SN',
  'SV',
  'TH',
  'TN',
  'TR',
  'TT',
  'TW',
  'TZ',
  'US',
  'UY',
  'UZ',
  'VN',
  'ZA',
] as const

export type ConnectCountry =
  (typeof STRIPE_CONNECT_SUPPORTED_COUNTRIES)[number]

const SUPPORTED_SET = new Set(STRIPE_CONNECT_SUPPORTED_COUNTRIES)

export const normalizeCountryCode = (value?: string | null) =>
  (value ?? '').trim().toUpperCase()

export const isStripeConnectCountry = (
  value?: string | null
): value is ConnectCountry => {
  const normalized = normalizeCountryCode(value)
  return Boolean(normalized) && SUPPORTED_SET.has(normalized as ConnectCountry)
}

export const parseStripeConnectCountryList = (
  raw?: string | null
): ConnectCountry[] => {
  if (!raw) return []
  const codes = raw
    .split(/[,\s]+/)
    .map(code => normalizeCountryCode(code))
    .filter(Boolean)

  return codes.filter(code =>
    SUPPORTED_SET.has(code as ConnectCountry)
  ) as ConnectCountry[]
}
