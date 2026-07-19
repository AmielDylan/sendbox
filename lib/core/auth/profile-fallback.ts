type SupabaseLikeError = {
  code?: string
  error?: string
  message?: string
}

const EXPECTED_PROFILE_FALLBACK_ERROR_CODES = new Set(['23503', '23505'])

export function isExpectedProfileFallbackError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const code = (error as SupabaseLikeError).code
  return Boolean(code && EXPECTED_PROFILE_FALLBACK_ERROR_CODES.has(code))
}

export function isExpectedProfileUpdateMiss(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const { code, error: errorMessage, message } = error as SupabaseLikeError
  return (
    code === 'PGRST116' ||
    errorMessage === 'Record not found' ||
    message === 'Record not found'
  )
}
