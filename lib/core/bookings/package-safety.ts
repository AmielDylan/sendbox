export const PACKAGE_CATEGORIES = [
  'documents',
  'clothing',
  'electronics',
  'cosmetics',
  'food',
  'other',
] as const

export type PackageCategory = (typeof PACKAGE_CATEGORIES)[number]

export const PACKAGE_CATEGORY_LABELS: Record<PackageCategory, string> = {
  documents: 'Documents',
  clothing: 'Vetements et textiles',
  electronics: 'Electronique',
  cosmetics: 'Cosmetiques',
  food: 'Alimentaire non perissable',
  other: 'Autre',
}

export const FORBIDDEN_PACKAGE_ITEMS = [
  'Produits illicites ou contrefaits',
  'Armes, munitions, explosifs ou objets dangereux',
  'Produits inflammables, corrosifs, toxiques ou sous pression',
  'Medicaments sur ordonnance ou substances reglementees',
  'Liquides en grande quantite ou mal conditionnes',
  'Argent liquide, bijoux ou objets de tres forte valeur non declares',
  'Denrees perissables, animaux ou produits biologiques',
  'Tout article interdit par la loi, les douanes ou la compagnie aerienne',
]

export const PACKAGE_REFUSAL_REASONS = [
  {
    value: 'unclear_content',
    label: 'Contenu trop flou',
  },
  {
    value: 'forbidden_or_risky_item',
    label: 'Objet interdit ou a risque',
  },
  {
    value: 'dimensions_inconsistent',
    label: 'Dimensions ou encombrement incompatibles',
  },
  {
    value: 'value_too_high',
    label: 'Valeur declaree trop elevee',
  },
  {
    value: 'photos_missing_or_unclear',
    label: 'Photos ou preuves insuffisantes',
  },
  {
    value: 'capacity_or_dates',
    label: 'Capacite ou dates incompatibles',
  },
  {
    value: 'other',
    label: 'Autre',
  },
] as const

export type PackageRefusalReason =
  (typeof PACKAGE_REFUSAL_REASONS)[number]['value']

export const PACKAGE_REFUSAL_REASON_LABELS: Record<
  PackageRefusalReason,
  string
> = PACKAGE_REFUSAL_REASONS.reduce(
  (labels, reason) => ({
    ...labels,
    [reason.value]: reason.label,
  }),
  {} as Record<PackageRefusalReason, string>
)

export function buildSafePackageDescription({
  category,
  dimensions,
  description,
}: {
  category: PackageCategory
  dimensions: string
  description: string
}) {
  return [
    `Categorie: ${PACKAGE_CATEGORY_LABELS[category]}`,
    `Dimensions approx.: ${dimensions}`,
    `Contenu declare: ${description.trim()}`,
    'Attestation expediteur: contenu conforme, non interdit, declare de bonne foi.',
  ].join('\n')
}

export function buildPackageRefusalReason({
  reason,
  details,
}: {
  reason: PackageRefusalReason
  details?: string
}) {
  const label = PACKAGE_REFUSAL_REASON_LABELS[reason]
  const normalizedDetails = details?.trim()

  if (reason === 'other') {
    return normalizedDetails || label
  }

  if (normalizedDetails) {
    return `${label} - ${normalizedDetails}`
  }

  return label
}
