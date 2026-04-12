import { NextResponse } from 'next/server'
import { getSubscriptionStatus } from '@/lib/core/subscriptions/actions'

export async function GET() {
  const result = await getSubscriptionStatus()

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 401 })
  }

  return NextResponse.json(result)
}
