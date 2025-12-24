/**
 * Shared Library
 * Exports centralisés pour le code partagé
 */

// Config
export * from './config/features'

// Database
export { createClient as createBrowserClient } from './db/client'
export { createClient as createServerClient } from './db/server'

// Security
export * from './security/rate-limit'
export * from './security/upload-validation'
export * from './security/xss-protection'

// Services
export * from './services/email/client'
export * from './services/stripe/config'
export * from './services/pdf/generation'

// Utils
export * from './utils'

