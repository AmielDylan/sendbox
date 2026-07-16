import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

const mockResendStore = {
  emails: new Map<string, any>(),
}

export const resendHandlers = [
  http.post('https://api.resend.com/emails', async ({ request }) => {
    const body = await request.json().catch(() => ({}))
    const emailId = `email_test_${faker.string.alphanumeric(24)}`
    const email = {
      id: emailId,
      object: 'email',
      created_at: new Date().toISOString(),
      ...((body || {}) as Record<string, unknown>),
    }

    mockResendStore.emails.set(emailId, email)

    return HttpResponse.json({ id: emailId }, { status: 200 })
  }),
]

export function resetMockResendStore() {
  mockResendStore.emails.clear()
}
