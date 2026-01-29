import { beforeAll, afterEach, afterAll } from 'vitest'
import { server, resetMockDatabase, resetMockStripeStore, resetMockAuthUser } from '../mocks/server'

/**
 * Configuration MSW pour Vitest
 * - beforeAll: Démarre le serveur MSW avant tous les tests
 * - afterEach: Réinitialise les handlers et les stores après chaque test
 * - afterAll: Arrête le serveur MSW après tous les tests
 */

// Démarre le serveur MSW avant tous les tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn', // Avertit des requêtes non mockées
  })
})

// Réinitialise les handlers et les stores après chaque test
afterEach(() => {
  // Reset les handlers MSW (retire les overrides custom)
  server.resetHandlers()

  // Reset les stores en mémoire
  resetMockDatabase()
  resetMockStripeStore()
  resetMockAuthUser()
})

// Arrête le serveur MSW après tous les tests
afterAll(() => {
  server.close()
})
