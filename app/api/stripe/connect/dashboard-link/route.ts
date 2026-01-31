/**
 * Get Stripe Connect Express dashboard link
 * GET /api/stripe/connect/dashboard-link
 */

import { createClient } from '@/lib/shared/db/server'
import { getExpressDashboardLink } from '@/lib/services/stripe-connect'

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
      return Response.json(
        { error: 'No Connect account found' },
        { status: 404 }
      )
    }

    const url = await getExpressDashboardLink(profile.stripe_connect_account_id)

    return Response.json({ url }, { status: 200 })
  } catch (error) {
    console.error('Get dashboard link error:', error)
    return Response.json(
      { error: 'Failed to get dashboard link' },
      { status: 500 }
    )
  }
}
