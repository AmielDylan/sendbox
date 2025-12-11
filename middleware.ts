/**
 * Middleware Next.js pour la gestion des sessions Supabase
 * Rafraîchit automatiquement les sessions expirées
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Rafraîchir la session si nécessaire
  // Cela garantit que les sessions expirées sont automatiquement renouvelées
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Routes publiques qui ne nécessitent pas d'authentification
  // Note: Les groupes de routes (auth) ne font pas partie de l'URL
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/reset-password',
    '/verify-email',
  ]
  const isPublicRoute = publicRoutes.some(route => pathname === route)

  // Routes protégées (dashboard)
  const isProtectedRoute = pathname.startsWith('/dashboard')
  
  // Routes admin
  const isAdminRoute = pathname.startsWith('/admin')

  // Si l'utilisateur essaie d'accéder à une route protégée sans être authentifié
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Vérifier les routes admin
  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if ((profile as any)?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Si l'utilisateur est authentifié et essaie d'accéder aux pages auth, rediriger vers dashboard
  // Exception : laisser accéder à /verify-email même si authentifié (pour la vérification)
  if (user && isPublicRoute && pathname !== '/' && pathname !== '/verify-email') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
