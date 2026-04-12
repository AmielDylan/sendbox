import { NextResponse } from 'next/server'
import { createCustomerPortal } from '@/lib/core/subscriptions/actions'

export async function POST() {
  const result = await createCustomerPortal()

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ url: result.url })
}
