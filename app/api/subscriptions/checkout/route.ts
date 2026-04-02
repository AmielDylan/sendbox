import { NextResponse } from 'next/server'
import { createSubscriptionCheckout } from '@/lib/core/subscriptions/actions'

export async function POST() {
  const result = await createSubscriptionCheckout()

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ url: result.url })
}
