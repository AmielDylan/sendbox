import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { setMockSessionCookies, resetMockSessionCookies } from '../../setup/test-utils'

/**
 * MSW Handlers pour mocker Supabase Auth
 * Ces handlers interceptent les appels à l'API Supabase Auth
 */

// Mock auth state - permet de définir l'utilisateur actuellement authentifié
let mockAuthUser: { id: string; email: string } | null = null

/**
 * Définit l'utilisateur actuellement authentifié pour les tests
 */
export function setMockAuthUser(user: { id: string; email: string } | null) {
  mockAuthUser = user

  if (user) {
    // Créer un cookie de session Supabase mocké
    const mockAccessToken = faker.string.alphanumeric(40)
    const mockRefreshToken = faker.string.alphanumeric(40)

    const sessionData = {
      access_token: mockAccessToken,
      refresh_token: mockRefreshToken,
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        aud: 'authenticated',
        role: 'authenticated',
      },
    }

    // Encoder en base64 comme le fait Supabase
    const sessionValue = JSON.stringify(sessionData)

    setMockSessionCookies([
      {
        name: 'sb-localhost-auth-token',
        value: sessionValue,
      },
    ])
  } else {
    resetMockSessionCookies()
  }
}

/**
 * Réinitialise l'état d'authentification
 */
export function resetMockAuthUser() {
  mockAuthUser = null
  resetMockSessionCookies()
}
export const authHandlers = [
  // Mock signup
  http.post('*/auth/v1/signup', async ({ request }) => {
    const body = (await request.json()) as {
      email: string
      password: string
      data?: Record<string, unknown>
    }

    const userId = faker.string.uuid()

    return HttpResponse.json(
      {
        access_token: faker.string.alphanumeric(40),
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        refresh_token: faker.string.alphanumeric(40),
        user: {
          id: userId,
          aud: 'authenticated',
          role: 'authenticated',
          email: body.email,
          email_confirmed_at: null,
          phone: '',
          confirmed_at: null,
          last_sign_in_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: body.data || {},
          identities: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  }),

  // Mock login (sign in with password)
  http.post('*/auth/v1/token', async ({ request }) => {
    const params = new URL(request.url).searchParams
    const grantType = params.get('grant_type')

    if (grantType === 'password') {
      const body = (await request.json()) as {
        email: string
        password: string
      }

      const userId = faker.string.uuid()

      return HttpResponse.json(
        {
          access_token: faker.string.alphanumeric(40),
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Date.now() + 3600000,
          refresh_token: faker.string.alphanumeric(40),
          user: {
            id: userId,
            aud: 'authenticated',
            role: 'authenticated',
            email: body.email,
            email_confirmed_at: new Date().toISOString(),
            phone: '',
            confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            app_metadata: {},
            user_metadata: {},
            identities: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
        { status: 200 }
      )
    }

    // Mock refresh token
    if (grantType === 'refresh_token') {
      return HttpResponse.json(
        {
          access_token: faker.string.alphanumeric(40),
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Date.now() + 3600000,
          refresh_token: faker.string.alphanumeric(40),
        },
        { status: 200 }
      )
    }

    return HttpResponse.json(
      { error: 'unsupported_grant_type' },
      { status: 400 }
    )
  }),

  // Mock logout
  http.post('*/auth/v1/logout', async () => {
    return HttpResponse.json({}, { status: 204 })
  }),

  // Mock get user
  http.get('*/auth/v1/user', async ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'invalid_token' },
        { status: 401 }
      )
    }

    // Utiliser mockAuthUser s'il est défini, sinon générer un utilisateur aléatoire
    const userId = mockAuthUser?.id || faker.string.uuid()
    const email = mockAuthUser?.email || faker.internet.email()

    return HttpResponse.json(
      {
        id: userId,
        aud: 'authenticated',
        role: 'authenticated',
        email: email,
        email_confirmed_at: new Date().toISOString(),
        phone: '',
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        identities: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 200 }
    )
  }),

  // Mock password reset request
  http.post('*/auth/v1/recover', async ({ request }) => {
    const body = (await request.json()) as { email: string }

    return HttpResponse.json(
      {
        message: `Password recovery email sent to ${body.email}`,
      },
      { status: 200 }
    )
  }),

  // Mock password reset (update)
  http.put('*/auth/v1/user', async ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'invalid_token' },
        { status: 401 }
      )
    }

    const body = (await request.json()) as {
      password?: string
      email?: string
      data?: Record<string, unknown>
    }

    const userId = faker.string.uuid()

    return HttpResponse.json(
      {
        id: userId,
        aud: 'authenticated',
        role: 'authenticated',
        email: body.email || faker.internet.email(),
        email_confirmed_at: new Date().toISOString(),
        phone: '',
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: body.data || {},
        identities: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 200 }
    )
  }),

  // Mock email verification
  http.post('*/auth/v1/verify', async ({ request }) => {
    const body = (await request.json()) as {
      type: string
      token: string
      email?: string
    }

    if (body.type === 'signup' || body.type === 'email') {
      return HttpResponse.json(
        {
          access_token: faker.string.alphanumeric(40),
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Date.now() + 3600000,
          refresh_token: faker.string.alphanumeric(40),
          user: {
            id: faker.string.uuid(),
            aud: 'authenticated',
            role: 'authenticated',
            email: body.email || faker.internet.email(),
            email_confirmed_at: new Date().toISOString(),
            phone: '',
            confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            app_metadata: {},
            user_metadata: {},
            identities: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
        { status: 200 }
      )
    }

    return HttpResponse.json(
      { error: 'invalid_request' },
      { status: 400 }
    )
  }),

  // Mock resend verification email
  http.post('*/auth/v1/resend', async ({ request }) => {
    const body = (await request.json()) as {
      type: string
      email: string
    }

    return HttpResponse.json(
      {
        message: `Verification email resent to ${body.email}`,
      },
      { status: 200 }
    )
  }),
]
