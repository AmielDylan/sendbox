/**
 * Route de callback pour l'authentification Supabase
 * Gère la vérification d'email et autres callbacks OAuth
 */

import { createClient } from '@/lib/shared/db/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard?verified=true'

  if (code) {
    const supabase = await createClient()

    // Échanger le code contre une session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Auth Callback] Error exchanging code for session:', error)
      // Rediriger vers login avec message d'erreur
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }

    // Succès - rediriger vers la page demandée
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // Si pas de code, rediriger vers login
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
