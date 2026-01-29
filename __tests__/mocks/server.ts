import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth.handlers'
import { databaseHandlers } from './handlers/database.handlers'
import { stripeHandlers } from './handlers/stripe.handlers'

/**
 * Serveur MSW pour les tests
 * Configure tous les handlers pour intercepter les requêtes HTTP pendant les tests
 */
export const server = setupServer(
  ...authHandlers,
  ...databaseHandlers,
  ...stripeHandlers
)

// Export des fonctions helpers pour réinitialiser les stores
export { resetMockDatabase, seedMockDatabase } from './handlers/database.handlers'
export { resetMockStripeStore, seedMockStripeStore } from './handlers/stripe.handlers'
