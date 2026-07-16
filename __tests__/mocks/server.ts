import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth.handlers'
import { databaseHandlers } from './handlers/database.handlers'
import { resendHandlers } from './handlers/resend.handlers'
import { storageHandlers } from './handlers/storage.handlers'
import { stripeHandlers } from './handlers/stripe.handlers'

/**
 * Serveur MSW pour les tests
 * Configure tous les handlers pour intercepter les requêtes HTTP pendant les tests
 */
export const server = setupServer(
  ...authHandlers,
  ...databaseHandlers,
  ...resendHandlers,
  ...storageHandlers,
  ...stripeHandlers
)

// Export des fonctions helpers pour réinitialiser les stores
export {
  resetMockDatabase,
  seedMockDatabase,
  getMockDatabase,
} from './handlers/database.handlers'
export {
  resetMockStripeStore,
  seedMockStripeStore,
} from './handlers/stripe.handlers'
export { resetMockResendStore } from './handlers/resend.handlers'
export { resetMockStorageStore } from './handlers/storage.handlers'
export { setMockAuthUser, resetMockAuthUser } from './handlers/auth.handlers'
