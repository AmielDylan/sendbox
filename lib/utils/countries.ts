/**
 * Utilities pour gérer les pays
 */

/**
 * Convertit un code pays ISO en nom complet
 * @param countryCode Code pays ISO (FR, BJ, etc.)
 * @returns Nom complet du pays en français
 */
export function getCountryName(countryCode: string): string {
  const countries: Record<string, string> = {
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

  return countries[countryCode] || countryCode
}
