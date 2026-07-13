export type ParsedReviewComment = {
  criteria: string[]
  comment: string | null
}

const CRITERIA_PREFIX = 'Criteres : '

export function parseReviewComment(
  value: string | null | undefined
): ParsedReviewComment {
  if (!value) {
    return { criteria: [], comment: null }
  }

  if (!value.startsWith(CRITERIA_PREFIX)) {
    return { criteria: [], comment: value }
  }

  const [criteriaLine, ...commentLines] = value.split('\n')
  const criteria = criteriaLine
    .replace(CRITERIA_PREFIX, '')
    .split(',')
    .map(criterion => criterion.trim())
    .filter(Boolean)

  const comment = commentLines.join('\n').trim()

  return {
    criteria,
    comment: comment || null,
  }
}
