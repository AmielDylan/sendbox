/**
 * Check Stripe Connect account status
 * GET /api/stripe/connect/status
 */

import { createClient } from '@/lib/shared/db/server'
import { checkAccountStatus } from '@/lib/services/stripe-connect'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_connect_account_id) {
      return Response.json({
        onboarded: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      })
    }

    const status = await checkAccountStatus(profile.stripe_connect_account_id)

    // Update profile with current status
    await supabase
      .from('profiles')
      .update({
        stripe_onboarding_completed: status.detailsSubmitted,
        stripe_payouts_enabled: status.payoutsEnabled,
      })
      .eq('id', user.id)

    return Response.json(
      {
        onboarded: status.detailsSubmitted,
        chargesEnabled: status.chargesEnabled,
        payoutsEnabled: status.payoutsEnabled,
        requirements: status.requirements,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get Connect status error:', error)
    return Response.json({ error: 'Failed to get status' }, { status: 500 })
  }
}
