/**
 * Helpers Stripe Identity
 */

import { stripe } from '@/lib/shared/services/stripe/config'

type IdentityVerificationInput = {
  email: string
  userId: string
  documentType: 'passport' | 'national_id'
  documentCountry: string
}

export async function createIdentityVerificationSession(
  input: IdentityVerificationInput
) {
  const session = await stripe.identity.verificationSessions.create({
    type: 'document',
    provided_details: {
      email: input.email,
    },
    metadata: {
      user_id: input.userId,
      document_type: input.documentType,
      document_country: input.documentCountry,
    },
    options: {
      document: {
        require_matching_selfie: true,
      },
    },
  })

  return {
    id: session.id,
    clientSecret: session.client_secret,
    url: session.url,
  }
}
