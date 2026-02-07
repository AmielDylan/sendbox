import {
  STRIPE_CONNECT_SUPPORTED_COUNTRIES,
  parseStripeConnectCountryList,
  type ConnectCountry,
} from '@/lib/shared/stripe/connect-countries'

export const getStripeConnectAllowedCountriesClient =
  (): ConnectCountry[] => {
    const parsed = parseStripeConnectCountryList(
      process.env.NEXT_PUBLIC_STRIPE_CONNECT_ALLOWED_COUNTRIES
    )
    return parsed.length > 0
      ? parsed
      : [...STRIPE_CONNECT_SUPPORTED_COUNTRIES]
  }
