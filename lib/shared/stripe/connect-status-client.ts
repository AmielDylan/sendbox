'use client'

const lastCallBySource = new Map<string, number>()

export async function fetchConnectStatus(
  source: string,
  minIntervalMs = 5000
): Promise<Response | null> {
  const now = Date.now()
  const lastCall = lastCallBySource.get(source) ?? 0
  if (now - lastCall < minIntervalMs) {
    return null
  }

  lastCallBySource.set(source, now)
  const encoded = encodeURIComponent(source)
  return fetch(`/api/connect/status?source=${encoded}`)
}
