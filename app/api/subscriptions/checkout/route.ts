import { NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'
import { createSubscriptionCheckout } from '@/lib/core/subscriptions/actions'
import { createFedaPaySubscriptionCheckout } from '@/lib/core/subscriptions/fedapay'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('country')
      .eq('id', user.id)
      .single()

    if ((profile as any)?.country === 'BJ') {
      const result = await createFedaPaySubscriptionCheckout()
      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ url: result.url })
    }
  }

  const result = await createSubscriptionCheckout()

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ url: result.url })
}
