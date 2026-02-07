import 'server-only'

import {
  STRIPE_CONNECT_SUPPORTED_COUNTRIES,
  normalizeCountryCode,
  parseStripeConnectCountryList,
  type ConnectCountry,
} from '@/lib/shared/stripe/connect-countries'

export const getStripeConnectAllowedCountries = (): ConnectCountry[] => {
  const envList =
    process.env.STRIPE_CONNECT_ALLOWED_COUNTRIES ||
    process.env.NEXT_PUBLIC_STRIPE_CONNECT_ALLOWED_COUNTRIES
  const parsed = parseStripeConnectCountryList(envList)
  return parsed.length > 0
    ? parsed
    : [...STRIPE_CONNECT_SUPPORTED_COUNTRIES]
}

export const getStripeConnectFallbackCountry = (
  allowedCountries: ConnectCountry[] = getStripeConnectAllowedCountries(),
  preferred: ConnectCountry = 'FR'
) => {
  if (allowedCountries.includes(preferred)) return preferred
  return allowedCountries[0] ?? null
}

export const resolveStripeConnectCountry = (
  value?: string | null,
  allowedCountries: ConnectCountry[] = getStripeConnectAllowedCountries()
) => {
  const normalized = normalizeCountryCode(value)
  if (!normalized) return null
  return allowedCountries.includes(normalized as ConnectCountry)
    ? (normalized as ConnectCountry)
    : null
}
