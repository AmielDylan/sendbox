/**
 * Helpers Stripe Identity
 */

import { stripe } from '@/lib/shared/services/stripe/config'

type IdentityVerificationInput = {
  email?: string | null
  userId: string
  documentType: 'passport' | 'national_id'
  documentCountry: string
  relatedPerson?: {
    accountId: string
    personId: string
  }
}

export async function createIdentityVerificationSession(
  input: IdentityVerificationInput
) {
  console.log('🔐 Creating Stripe Identity verification session:', {
    email: input.email,
    userId: input.userId,
    documentType: input.documentType,
    documentCountry: input.documentCountry,
  })

  try {
    const flowId = process.env.STRIPE_IDENTITY_FLOW_ID
    const session = await stripe.identity.verificationSessions.create({
      ...(flowId
        ? { verification_flow: flowId }
        : {
            type: 'document',
            options: { document: { require_matching_selfie: true } },
          }),
      // related_person only supported with type:'document', not with verification_flow
      ...(!flowId && input.relatedPerson
        ? {
            related_person: {
              account: input.relatedPerson.accountId,
              person: input.relatedPerson.personId,
            },
          }
        : {}),
      ...(input.email
        ? {
            provided_details: {
              email: input.email,
            },
          }
        : {}),
      metadata: {
        user_id: input.userId,
        document_type: input.documentType,
        document_country: input.documentCountry,
        ...(input.relatedPerson?.accountId
          ? { stripe_account_id: input.relatedPerson.accountId }
          : {}),
        ...(input.relatedPerson?.personId
          ? { stripe_person_id: input.relatedPerson.personId }
          : {}),
      },
    })

    console.log('✅ Stripe Identity session created:', session.id)

    return {
      id: session.id,
      clientSecret: session.client_secret,
      url: session.url,
    }
  } catch (error) {
    console.error('❌ Stripe Identity API error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error,
    })
    throw error
  }
}
