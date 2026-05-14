export const LOCATIONS: Record<string, { label: string; cities: string[] }> = {
  FR: {
    label: 'France',
    cities: ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Lille', 'Strasbourg', 'Nantes', 'Toulouse'],
  },
  BJ: {
    label: 'Bénin',
    cities: ['Cotonou', 'Porto-Novo', 'Abomey-Calavi', 'Parakou', 'Bohicon', 'Abomey'],
  },
  TG: { label: 'Togo', cities: ['Lomé', 'Sokodé', 'Kara'] },
  SN: { label: 'Sénégal', cities: ['Dakar', 'Thiès', 'Saint-Louis'] },
  CI: { label: "Côte d'Ivoire", cities: ['Abidjan', 'Bouaké', 'Yamoussoukro'] },
  CM: { label: 'Cameroun', cities: ['Douala', 'Yaoundé', 'Bafoussam'] },
  BE: { label: 'Belgique', cities: ['Bruxelles', 'Liège', 'Anvers'] },
  GB: { label: 'Royaume-Uni', cities: ['Londres', 'Birmingham', 'Manchester'] },
}

export function validateTripLocation(
  country: string,
  city: string,
  field: string
): string | null {
  const entry = LOCATIONS[country]
  if (!entry) return `${field}Country: pays non autorisé`
  if (!entry.cities.includes(city)) return `${field}City: ville non autorisée pour ce pays`
  return null
}
