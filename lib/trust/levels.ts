export type TrustLevelKey = 'new' | 'reliable' | 'very_reliable' | 'ambassador'

export type TrustLevelInput = {
  trustScore?: number | null
  completedCount?: number | null
  disputedCount?: number | null
}

export type TrustLevel = {
  key: TrustLevelKey
  label: string
  shortLabel: string
  description: string
}

const TRUST_LEVELS: Record<TrustLevelKey, TrustLevel> = {
  new: {
    key: 'new',
    label: 'Nouveau profil',
    shortLabel: 'Nouveau',
    description: 'Profil récent, encore peu évalué sur Sendbox.',
  },
  reliable: {
    key: 'reliable',
    label: 'Profil fiable',
    shortLabel: 'Fiable',
    description: 'Premiers échanges réussis et avis positifs.',
  },
  very_reliable: {
    key: 'very_reliable',
    label: 'Profil très fiable',
    shortLabel: 'Très fiable',
    description: 'Historique solide, avis élevés et aucun litige récent.',
  },
  ambassador: {
    key: 'ambassador',
    label: 'Ambassadeur Sendbox',
    shortLabel: 'Ambassadeur',
    description: 'Profil expérimenté avec une excellente réputation.',
  },
}

function toNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function getTrustLevel(input: TrustLevelInput): TrustLevel {
  const trustScore = toNumber(input.trustScore)
  const completedCount = toNumber(input.completedCount)
  const disputedCount = toNumber(input.disputedCount)

  if (trustScore >= 4.8 && completedCount >= 10 && disputedCount === 0) {
    return TRUST_LEVELS.ambassador
  }

  if (trustScore >= 4.5 && completedCount >= 5 && disputedCount === 0) {
    return TRUST_LEVELS.very_reliable
  }

  if (trustScore >= 4 && completedCount >= 2) {
    return TRUST_LEVELS.reliable
  }

  return TRUST_LEVELS.new
}

export function formatTrustScore(score: number | null | undefined) {
  const normalized = toNumber(score)
  return normalized > 0 ? normalized.toFixed(1) : null
}
