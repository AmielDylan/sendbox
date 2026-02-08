/**
 * Stripe Identity - supported countries and document types.
 * Source: https://docs.stripe.com/identity/selfie (Verification checks / Availability)
 */

export const STRIPE_IDENTITY_SUPPORTED_COUNTRIES = [
  'AL',
  'DZ',
  'AR',
  'AM',
  'AU',
  'AT',
  'AZ',
  'BS',
  'BH',
  'BD',
  'BY',
  'BE',
  'BJ',
  'BO',
  'BR',
  'BG',
  'CM',
  'CA',
  'CL',
  'CN',
  'CO',
  'CR',
  'CI',
  'HR',
  'CY',
  'CZ',
  'DK',
  'DO',
  'EC',
  'EG',
  'SV',
  'EE',
  'FI',
  'FR',
  'GE',
  'DE',
  'GH',
  'GR',
  'GT',
  'HT',
  'HN',
  'HK',
  'HU',
  'IN',
  'ID',
  'IQ',
  'IE',
  'IL',
  'IT',
  'JM',
  'JP',
  'JE',
  'JO',
  'KZ',
  'KE',
  'KW',
  'LV',
  'LB',
  'LI',
  'LT',
  'LU',
  'MY',
  'MT',
  'MU',
  'MX',
  'MD',
  'MN',
  'MA',
  'MM',
  'NP',
  'NL',
  'NZ',
  'NG',
  'MK',
  'NO',
  'PK',
  'PS',
  'PA',
  'PY',
  'PE',
  'PH',
  'PL',
  'PT',
  'PR',
  'RO',
  'RU',
  'SA',
  'RS',
  'SG',
  'SK',
  'SI',
  'ZA',
  'KR',
  'ES',
  'LK',
  'SE',
  'CH',
  'TW',
  'TH',
  'TN',
  'TR',
  'UG',
  'UA',
  'AE',
  'GB',
  'US',
  'UY',
  'UZ',
  'VE',
  'VN',
] as const

export type StripeIdentityCountry =
  (typeof STRIPE_IDENTITY_SUPPORTED_COUNTRIES)[number]

export type IdentityDocumentType = 'passport' | 'national_id'

const SUPPORTED_SET = new Set(STRIPE_IDENTITY_SUPPORTED_COUNTRIES)

// Override list for countries where national ID is not supported by Stripe Identity.
const PASSPORT_ONLY_COUNTRIES = new Set<StripeIdentityCountry>(['CM'])

export const isStripeIdentityCountrySupported = (
  value?: string | null
): value is StripeIdentityCountry => {
  if (!value) return false
  const normalized = value.trim().toUpperCase()
  return SUPPORTED_SET.has(normalized as StripeIdentityCountry)
}

export const getStripeIdentityDocumentTypes = (
  value?: string | null
): IdentityDocumentType[] => {
  if (!value) return ['passport', 'national_id']
  const normalized = value.trim().toUpperCase()
  if (!SUPPORTED_SET.has(normalized as StripeIdentityCountry)) {
    return ['passport']
  }
  if (PASSPORT_ONLY_COUNTRIES.has(normalized as StripeIdentityCountry)) {
    return ['passport']
  }
  return ['passport', 'national_id']
}
