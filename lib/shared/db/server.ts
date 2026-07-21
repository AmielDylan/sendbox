/**
 * Client Supabase pour le serveur (Server Components, Server Actions, Route Handlers)
 * Utilise @supabase/ssr pour la gestion des cookies et sessions côté serveur
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

let testCookieCounter = 0
const TEST_AUTH_COOKIE_NAME = 'sb-localhost-auth-token'

export async function createClient() {
  const cookieStore = await cookies()
  const cookieOptions =
    process.env.NODE_ENV === 'test'
      ? { name: `${TEST_AUTH_COOKIE_NAME}-${++testCookieCounter}` }
      : undefined

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions,
      cookies: {
        getAll() {
          const allCookies = cookieStore.getAll()

          if (!cookieOptions?.name) {
            return allCookies
          }

          const mockAuthCookie = allCookies.find(
            cookie => cookie.name === TEST_AUTH_COOKIE_NAME
          )

          if (!mockAuthCookie) {
            return allCookies
          }

          return [
            ...allCookies,
            {
              ...mockAuthCookie,
              name: cookieOptions.name,
            },
          ]
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
