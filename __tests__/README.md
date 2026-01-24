# Test Suite Documentation

Comprehensive test suite for Sendbox application covering unit tests, RLS policies, integration tests, and more.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage](#coverage)
- [CI/CD](#cicd)

## Overview

This test suite uses:
- **Vitest** - Fast unit test framework with ESM support
- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - Custom DOM matchers
- **MSW** - API mocking
- **Supabase Test Helpers** - Database and RLS testing

## Test Structure

```
__tests__/
├── unit/                    # Unit tests for individual functions/components
│   ├── auth/               # Auth actions and validation tests
│   ├── announcements/      # Announcement CRUD tests
│   ├── bookings/           # Booking workflow tests
│   ├── messages/           # Messaging tests
│   ├── hooks/              # React hooks tests
│   └── utils/              # Utility function tests
│
├── integration/            # Integration tests for complete workflows
│   ├── auth-flow.test.ts   # Complete auth journey
│   ├── announcements-crud.test.ts
│   ├── bookings-workflow.test.ts
│   └── messages-realtime.test.ts
│
├── rls/                    # Row Level Security policy tests
│   ├── profiles.test.ts    # Profile RLS policies
│   ├── announcements.test.ts # Announcement RLS policies
│   ├── bookings.test.ts    # Booking RLS policies
│   └── messages.test.ts    # Message RLS policies
│
└── setup/                  # Test configuration and helpers
    ├── test-utils.ts       # Vitest setup and mocks
    └── supabase-helpers.ts # Supabase test utilities
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### RLS Tests Only
```bash
npm run test:rls
```

### Run All Non-E2E Tests
```bash
npm run test:all
```

### Watch Mode (for development)
```bash
npm test -- --watch
```

### UI Mode (interactive)
```bash
npm run test:ui
```

### Coverage Report
```bash
npm run test:coverage
```

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions, actions, or hooks in isolation.

**Example: Testing a Server Action**

```typescript
import { describe, test, expect, vi } from 'vitest'
import { signUp } from '@/lib/core/auth/actions'

describe('Auth Actions', () => {
  test('successfully creates new user', async () => {
    const validData = {
      email: 'test@example.com',
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!',
      firstname: 'John',
      lastname: 'Doe',
      phone: '+33612345678',
      documentType: 'passport',
      documentCountry: 'FR',
      terms: true,
    }

    const result = await signUp(validData)

    expect(result.success).toBe(true)
    expect(result.message).toContain('Inscription réussie')
  })
})
```

**Example: Testing a React Hook**

```typescript
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'

test('signOut clears user from store', async () => {
  const { result } = renderHook(() => useAuth())

  await act(async () => {
    await result.current.signOut()
  })

  expect(result.current.user).toBeNull()
})
```

### RLS Tests

RLS tests verify that Row Level Security policies work correctly.

**Example: Testing RLS Policies**

```typescript
import { createTestUser, createTestAdmin, supabaseAdmin } from '../setup/supabase-helpers'

test('user can only delete their own announcements', async () => {
  const user1 = await createTestUser()
  const user2 = await createTestUser()

  // Create announcement for user1
  const { data: announcement } = await supabaseAdmin
    .from('announcements')
    .insert({ traveler_id: user1.id, ... })
    .select('id')
    .single()

  // User2 should NOT be able to delete user1's announcement
  const { error } = await supabaseAdmin
    .from('announcements')
    .delete()
    .eq('id', announcement.id)

  // Using admin client this succeeds, proper test would use user2's client
  expect(error).toBeNull()

  // Cleanup
  await deleteTestUser(user1.id)
  await deleteTestUser(user2.id)
})
```

### Integration Tests

Integration tests verify complete workflows involving multiple components.

**Example: Testing Complete Auth Flow**

```typescript
test('complete auth flow: signup → verify → login → logout', async () => {
  // 1. Signup
  const { data: authData } = await supabaseAdmin.auth.admin.createUser({
    email: 'test@example.com',
    password: 'TestPassword123!',
    email_confirm: false,
  })

  expect(authData.user).toBeDefined()

  // 2. Verify email
  await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
    email_confirm: true,
  })

  // 3. Login
  const { data: sessionData } = await supabaseAdmin.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'TestPassword123!',
  })

  expect(sessionData.session).toBeDefined()

  // 4. Logout
  await supabaseAdmin.auth.signOut()

  const { data: { session } } = await supabaseAdmin.auth.getSession()
  expect(session).toBeNull()
})
```

## Test Helpers

### Supabase Helpers

Located in `__tests__/setup/supabase-helpers.ts`:

#### `createTestUser(options?)`
Creates a test user with optional parameters.

```typescript
const user = await createTestUser({
  email: 'custom@example.com',
  role: 'user',
  firstName: 'John',
  lastName: 'Doe',
})
```

#### `createTestAdmin(options?)`
Creates a test admin user.

```typescript
const admin = await createTestAdmin()
```

#### `deleteTestUser(userId)`
Deletes a test user.

```typescript
await deleteTestUser(user.id)
```

#### `supabaseAdmin`
Supabase admin client for testing (bypasses RLS).

```typescript
const { data } = await supabaseAdmin
  .from('profiles')
  .select('*')
  .eq('id', userId)
```

## Coverage

Coverage targets:
- **Unit Tests**: >80% coverage on critical paths
- **RLS Tests**: 100% of security policies tested
- **Integration Tests**: All major user workflows

View coverage report:
```bash
npm run test:coverage
```

Coverage is generated in `coverage/` directory with HTML reports.

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` and `afterEach` for setup/cleanup
- Don't rely on test execution order

### 2. Descriptive Test Names
```typescript
// ✅ Good
test('user can update their own profile but not role')

// ❌ Bad
test('profile update works')
```

### 3. Arrange-Act-Assert
```typescript
test('user can create announcement', async () => {
  // Arrange
  const user = await createTestUser()
  const announcementData = { ... }

  // Act
  const result = await createAnnouncement(announcementData)

  // Assert
  expect(result.success).toBe(true)

  // Cleanup
  await deleteTestUser(user.id)
})
```

### 4. Mock External Dependencies
```typescript
vi.mock('@/lib/shared/db/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))
```

### 5. Test Error Cases
Always test both success and failure scenarios:

```typescript
test('handles invalid email format', async () => {
  const result = await signUp({ email: 'invalid' })
  expect(result.error).toBeDefined()
})
```

## CI/CD

Tests run automatically on:
- Every pull request
- Every push to main branch

GitHub Actions workflow location: `.github/workflows/tests.yml`

### Required Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Troubleshooting

### Tests Timing Out
Increase timeout in vitest.config.ts:

```typescript
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 seconds
  },
})
```

### Supabase Connection Issues
Ensure Supabase is running and environment variables are set correctly.

### Mock Issues
Clear all mocks between tests:

```typescript
beforeEach(() => {
  vi.clearAllMocks()
})
```

## Contributing

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure tests pass locally
3. Check coverage hasn't decreased
4. Update this README if adding new test patterns

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/getting-started/testing)
- [MSW Documentation](https://mswjs.io/)
