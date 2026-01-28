/**
 * Rate limiting pour protéger contre les abus
 * Solution basique avec cookies (pour production, utiliser Upstash Redis)
 */

import { cookies } from 'next/headers'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number // en millisecondes
  identifier: string
}

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: Date
}

/**
 * Rate limiting basique avec cookies
 * Pour production, utiliser Upstash Redis ou similaire
 */
export async function rateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const cookieStore = await cookies()
  const cookieName = `rate_limit_${config.identifier}`
  const cookie = cookieStore.get(cookieName)

  const now = new Date()
  let record = cookie
    ? JSON.parse(cookie.value)
    : { count: 0, reset: new Date(now.getTime() + config.windowMs) }

  // Réinitialiser si la fenêtre est expirée
  if (now > new Date(record.reset)) {
    record = {
      count: 0,
      reset: new Date(now.getTime() + config.windowMs),
    }
  }

  // Vérifier la limite
  if (record.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      reset: new Date(record.reset),
    }
  }

  // Incrémenter le compteur
  record.count++

  // Sauvegarder dans le cookie
  cookieStore.set(cookieName, JSON.stringify(record), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.floor(config.windowMs / 1000),
    path: '/',
  })

  return {
    success: true,
    remaining: config.maxRequests - record.count,
    reset: new Date(record.reset),
  }
}

/**
 * Rate limiting pour l'authentification
 */
export async function authRateLimit(identifier: string) {
  return rateLimit({
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    identifier: `auth_${identifier}`,
  })
}

/**
 * Rate limiting pour les API
 */
export async function apiRateLimit(identifier: string) {
  return rateLimit({
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 heure
    identifier: `api_${identifier}`,
  })
}

/**
 * Rate limiting pour les uploads
 */
export async function uploadRateLimit(identifier: string) {
  return rateLimit({
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 heure
    identifier: `upload_${identifier}`,
  })
}

/**
 * Rate limiting pour les actions sensibles (changement password, etc.)
 */
export async function sensitiveActionRateLimit(identifier: string) {
  return rateLimit({
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 heure
    identifier: `sensitive_${identifier}`,
  })
}
