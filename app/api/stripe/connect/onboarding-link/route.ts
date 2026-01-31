/**
 * Get Stripe Connect onboarding link
 * POST /api/stripe/connect/onboarding-link
 */

import { createClient } from '@/lib/shared/db/server'
import { createAccountLink } from '@/lib/services/stripe-connect'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accountId } = await req.json()

    if (!accountId) {
      return Response.json({ error: 'Account ID required' }, { status: 400 })
    }

    const link = await createAccountLink(accountId)

    return Response.json({ url: link.url }, { status: 200 })
  } catch (error) {
    console.error('Get onboarding link error:', error)
    return Response.json(
      { error: 'Failed to get onboarding link' },
      { status: 500 }
    )
  }
}
