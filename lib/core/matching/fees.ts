export const DEFAULT_MATCHING_FEE_CENTS = 290
export const DEFAULT_MATCHING_FEE_CURRENCY = 'eur'

export function getMatchingFeeConfig() {
  const amountCents = Number.parseInt(
    process.env.MATCHING_FEE_CENTS ?? `${DEFAULT_MATCHING_FEE_CENTS}`,
    10
  )

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error('MATCHING_FEE_CENTS doit etre un entier positif')
  }

  return {
    amountCents,
    currency:
      process.env.MATCHING_FEE_CURRENCY ?? DEFAULT_MATCHING_FEE_CURRENCY,
  }
}

export function formatFeeFromCents(amountCents: number): string {
  return `${(amountCents / 100).toFixed(2).replace('.', ',')} EUR`
}
