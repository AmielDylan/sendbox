import { createClient } from '@/lib/shared/db/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as
    | 'signup'
    | 'email'
    | 'recovery'
    | 'magiclink'
    | null
  const isOAuth = requestUrl.searchParams.get('oauth') === 'true'
  const next = requestUrl.searchParams.get('next') ?? '/dashboard?verified=true'

  // OAuth PKCE code exchange
  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error.message)}`,
          requestUrl.origin
        )
      )
    }

    if (isOAuth && data.session) {
      // Vérifier si un profil Sendbox existe (= compte préexistant)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.session.user.id)
        .single()

      if (!profile) {
        await supabase.auth.signOut()
        return NextResponse.redirect(
          new URL('/login?error=no_linked_account', requestUrl.origin)
        )
      }
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // OTP token_hash (email confirmation, password reset, magic link)
  if (token_hash && type) {
    const supabase = await createClient()

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

    // Recovery = réinitialisation mot de passe : rediriger vers le formulaire de mise à jour
    if (type === 'recovery') {
      return NextResponse.redirect(
        new URL('/reset-password?update=true', requestUrl.origin)
      )
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  return NextResponse.redirect(
    new URL('/login?error=missing_token', requestUrl.origin)
  )
}
