/**
 * Utilities pour gérer les pays
 */

export const COUNTRY_NAMES: Record<string, string> = {
  'FR': 'France',
  'BJ': 'Bénin',
  'CI': 'Côte d\'Ivoire',
  'SN': 'Sénégal',
  'TG': 'Togo',
  'BF': 'Burkina Faso',
  'ML': 'Mali',
  'NE': 'Niger',
  'GN': 'Guinée',
  'CM': 'Cameroun',
  'CD': 'République Démocratique du Congo',
  'CG': 'Congo',
  'GA': 'Gabon',
  'MA': 'Maroc',
  'DZ': 'Algérie',
  'TN': 'Tunisie',
  'BE': 'Belgique',
  'CH': 'Suisse',
  'CA': 'Canada',
  'LU': 'Luxembourg',
  'MC': 'Monaco',
}

/**
 * Convertit un code pays ISO en nom complet
 * @param countryCode Code pays ISO (FR, BJ, etc.)
 * @returns Nom complet du pays en français
 */
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
