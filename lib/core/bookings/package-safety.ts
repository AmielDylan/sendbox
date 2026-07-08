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
