export const RESIDENCE_COUNTRIES = ['FR', 'BJ'] as const

export type ResidenceCountry = (typeof RESIDENCE_COUNTRIES)[number]

export const normalizeResidenceCountry = (value?: string | null) =>
  (value ?? '').trim().toUpperCase()

export const isResidenceCountry = (
  value?: string | null
): value is ResidenceCountry => {
  const normalized = normalizeResidenceCountry(value)
  return (
    Boolean(normalized) &&
    RESIDENCE_COUNTRIES.includes(normalized as ResidenceCountry)
  )
}

export const getResidenceCountries = () => [...RESIDENCE_COUNTRIES]
