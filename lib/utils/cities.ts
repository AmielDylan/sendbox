/**
 * Utilitaires pour l'autocomplete des villes
 */

// Villes du Bénin (liste prédéfinie)
export const BENIN_CITIES = [
  'Cotonou',
  'Porto-Novo',
  'Parakou',
  'Djougou',
  'Bohicon',
  'Abomey',
  'Natitingou',
  'Lokossa',
  'Ouidah',
  'Kandi',
  'Savalou',
  'Sakété',
  'Comè',
  'Kérou',
  'Malanville',
] as const

export type BeninCity = (typeof BENIN_CITIES)[number]

/**
 * Recherche de villes françaises via API Adresse
 */
export async function searchFrenchCities(query: string): Promise<string[]> {
  if (query.length < 2) {
    return []
  }

  try {
    const response = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=municipality&limit=10`
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const cities = new Set<string>()

    // Extraire les noms de villes uniques
    if (data.features) {
      for (const feature of data.features) {
        const city = feature.properties?.city
        if (city && city.toLowerCase().includes(query.toLowerCase())) {
          cities.add(city)
        }
      }
    }

    return Array.from(cities).slice(0, 10)
  } catch (error) {
    console.error('Error fetching French cities:', error)
    return []
  }
}

/**
 * Recherche de villes du Bénin (liste prédéfinie)
 */
export function searchBeninCities(query: string): string[] {
  if (query.length < 1) {
    return BENIN_CITIES.slice(0, 10)
  }

  const lowerQuery = query.toLowerCase()
  return BENIN_CITIES.filter(city =>
    city.toLowerCase().includes(lowerQuery)
  ).slice(0, 10)
}

/**
 * Recherche de villes selon le pays
 */
export async function searchCities(
  country: 'FR' | 'BJ',
  query: string
): Promise<string[]> {
  if (country === 'FR') {
    return searchFrenchCities(query)
  } else {
    return Promise.resolve(searchBeninCities(query))
  }
}



