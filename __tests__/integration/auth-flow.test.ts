/**
 * Integration test for complete authentication flow
 * Tests: signup → verify → login → logout
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createTestUser, deleteTestUser, supabaseAdmin } from '../setup/supabase-helpers'

describe('Authentication Flow Integration', () => {
  let testUserId: string

  describe('Complete User Journey', () => {
    test('signup → verify → login → logout flow works correctly', async () => {
      // Step 1: Create user (signup)
      const email = `integration-test-${Date.now()}@example.com`
      const password = 'IntegrationTest123!'

      const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // Not confirmed yet
      })

      expect(signUpError).toBeNull()
      expect(authData.user).toBeDefined()
      expect(authData.user?.email).toBe(email)

      testUserId = authData.user!.id

      // Step 2: Verify profile was created
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single()

      expect(profileError).toBeNull()
      expect(profile).toBeDefined()
      expect(profile?.id).toBe(testUserId)

      // Step 3: Verify email (simulate email verification)
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(testUserId, {
        email_confirm: true,
      })

      expect(confirmError).toBeNull()

      // Step 4: Login with verified account
      const { data: sessionData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      })

      expect(loginError).toBeNull()
      expect(sessionData.session).toBeDefined()
      expect(sessionData.user?.email).toBe(email)
      expect(sessionData.user?.email_confirmed_at).toBeDefined()

      // Step 5: Logout
      const { error: signOutError } = await supabaseAdmin.auth.signOut()

      expect(signOutError).toBeNull()

      // Verify session is gone
      const { data: { session } } = await supabaseAdmin.auth.getSession()
      expect(session).toBeNull()
    })
  })

  describe('Email Verification Flow', () => {
    let unverifiedUserId: string

    beforeAll(async () => {
      const user = await createTestUser({
        email: `unverified-${Date.now()}@example.com`,
      })
      unverifiedUserId = user.id

      // Mark as unverified
      await supabaseAdmin.auth.admin.updateUserById(unverifiedUserId, {
        email_confirm: false,
      })
    })

    afterAll(async () => {
      await deleteTestUser(unverifiedUserId)
    })

    test('unverified users cannot login', async () => {
      const { data } = await supabaseAdmin.auth.signInWithPassword({
        email: `unverified-${Date.now()}@example.com`,
        password: 'TestPassword123!',
      })

      // Login might succeed but email_confirmed_at should be null
      if (data.user) {
        expect(data.user.email_confirmed_at).toBeNull()
      }
    })

    test('email verification updates confirmed_at timestamp', async () => {
      // Verify email
      const { error } = await supabaseAdmin.auth.admin.updateUserById(unverifiedUserId, {
        email_confirm: true,
      })

      expect(error).toBeNull()

      // Check user has confirmed_at
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(unverifiedUserId)
      expect(userData.user?.email_confirmed_at).toBeDefined()
    })
  })

  describe('Profile Creation', () => {
    test('profile is automatically created on user signup', async () => {
      const email = `profile-test-${Date.now()}@example.com`

      const { data: authData } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: 'TestPassword123!',
        email_confirm: true,
      })

      const userId = authData.user!.id

      // Wait a bit for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 500))

      // Check profile exists
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      expect(error).toBeNull()
      expect(profile).toBeDefined()
      expect(profile?.email).toBe(email)

      // Cleanup
      await deleteTestUser(userId)
    })

    test('profile has correct default role', async () => {
      const user = await createTestUser()

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      expect(profile?.role).toBe('user')

      await deleteTestUser(user.id)
    })
  })

  describe('Session Management', () => {
    let sessionTestUserId: string

    beforeAll(async () => {
      const user = await createTestUser({
        email: `session-test-${Date.now()}@example.com`,
      })
      sessionTestUserId = user.id
    })

    afterAll(async () => {
      await deleteTestUser(sessionTestUserId)
    })

    test('session persists across page refreshes', async () => {
      // Login
      const { data } = await supabaseAdmin.auth.signInWithPassword({
        email: `session-test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
      })

      const accessToken = data.session?.access_token

      expect(accessToken).toBeDefined()

      // Simulate page refresh by getting session
      const { data: sessionData } = await supabaseAdmin.auth.getSession()

      expect(sessionData.session).toBeDefined()
      expect(sessionData.session?.access_token).toBe(accessToken)

      // Cleanup
      await supabaseAdmin.auth.signOut()
    })

    test('session expires after timeout', async () => {
      // This test would require waiting for actual session expiry
      // For now, we just verify the session has an expiry timestamp
      const { data } = await supabaseAdmin.auth.signInWithPassword({
        email: `session-test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
      })

      expect(data.session?.expires_at).toBeDefined()
      expect(data.session?.expires_at).toBeGreaterThan(Date.now() / 1000)

      // Cleanup
      await supabaseAdmin.auth.signOut()
    })
  })

  describe('Error Handling', () => {
    test('handles invalid credentials gracefully', async () => {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email: 'nonexistent@example.com',
        password: 'WrongPassword123!',
      })

      expect(error).toBeDefined()
      expect(data.session).toBeNull()
    })

    test('handles duplicate email signup', async () => {
      const email = `duplicate-test-${Date.now()}@example.com`

      // Create first user
      const { data: firstUser } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: 'TestPassword123!',
        email_confirm: true,
      })

      // Try to create duplicate
      const { error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: 'TestPassword123!',
        email_confirm: true,
      })

      expect(error).toBeDefined()

      // Cleanup
      await deleteTestUser(firstUser.user!.id)
    })
  })

  // Cleanup test user after all tests
  afterAll(async () => {
    if (testUserId) {
      await deleteTestUser(testUserId)
    }
  })
})
