/**
 * Pays couverts par Sendbox V1 :
 * - Départ : pays européens couverts par Stripe Connect
 * - Arrivée : Bénin (BJ)
 */

export const COUNTRY_NAMES: Record<string, string> = {
  FR: 'France',
  BE: 'Belgique',
  CH: 'Suisse',
  DE: 'Allemagne',
  IT: 'Italie',
  ES: 'Espagne',
  NL: 'Pays-Bas',
  PT: 'Portugal',
  LU: 'Luxembourg',
  AT: 'Autriche',
  IE: 'Irlande',
  GB: 'Royaume-Uni',
  SE: 'Suède',
  NO: 'Norvège',
  DK: 'Danemark',
  FI: 'Finlande',
  // Destination
  BJ: 'Bénin',
}

export function getCountryName(countryCode: string): string {
  return COUNTRY_NAMES[countryCode] || countryCode
}

export function getCountryFlagEmoji(countryCode: string): string {
  const code = countryCode?.toUpperCase()
  if (!code || code.length !== 2) {
    return '🌍'
  }
  const base = 0x1f1e6
  const first = base + code.charCodeAt(0) - 65
  const second = base + code.charCodeAt(1) - 65
  return String.fromCodePoint(first, second)
}

export const COUNTRY_OPTIONS = Object.entries(COUNTRY_NAMES).map(
  ([code, name]) => ({
    code,
    name,
    flag: getCountryFlagEmoji(code),
  })
)
