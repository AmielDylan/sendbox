/**
 * Route de callback pour l'authentification Supabase
 * Gère la vérification d'email et autres callbacks OAuth
 */

import { createClient } from '@/lib/shared/db/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as
    | 'signup'
    | 'email'
    | 'recovery'
    | 'magiclink'
    | null
  const next = requestUrl.searchParams.get('next') ?? '/dashboard?verified=true'

  if (token_hash && type) {
    const supabase = await createClient()

    // Vérifier le token OTP (utilisé par les emails Supabase)
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })

    if (error) {
      console.error('[Auth Callback] Error verifying OTP:', error)
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error.message)}`,
          requestUrl.origin
        )
      )
    }

    // Succès - rediriger vers la page demandée
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // Si pas de token_hash, rediriger vers login
  return NextResponse.redirect(
    new URL('/login?error=missing_token', requestUrl.origin)
  )
}
