export const FEDAPAY_SUPPORTED_COUNTRIES = [
  'BJ', // Bénin
  'SN', // Sénégal
  'BF', // Burkina Faso
  'CI', // Côte d'Ivoire
  'TG', // Togo
  'NE', // Niger
  'GN', // Guinée
  'ML', // Mali
] as const

// From Flutterwave sandbox API validation responses (banks/networks endpoints).
export const FLUTTERWAVE_BANK_COUNTRIES = [
  'CM',
  'CI',
  'CG',
  'EG',
  'ET',
  'GA',
  'GH',
  'IN',
  'KE',
  'MW',
  'NG',
  'RW',
  'SL',
  'SN',
  'TD',
  'TZ',
  'UG',
  'US',
  'ZA',
  'ZM',
] as const

export const FLUTTERWAVE_MOBILE_NETWORK_COUNTRIES = [
  'CG',
  'CM',
  'CI',
  'EG',
  'ET',
  'GA',
  'GH',
  'KE',
  'MW',
  'RW',
  'SN',
  'TZ',
  'TD',
  'UG',
  'ZM',
] as const

export type SupportedCountry =
  | (typeof FEDAPAY_SUPPORTED_COUNTRIES)[number]
  | (typeof FLUTTERWAVE_BANK_COUNTRIES)[number]
  | (typeof FLUTTERWAVE_MOBILE_NETWORK_COUNTRIES)[number]
