import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { confirmMatchingForBooking } from '@/lib/core/matching/confirm'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Non authentifié', code: 'UNAUTHENTICATED' },
      { status: 401 }
    )
  }

  const admin = createAdminClient()
  const { data: transaction } = await admin
    .from('transactions')
    .select('booking_id')
    .eq('id', id)
    .single()

  if (!transaction?.booking_id) {
    return NextResponse.json(
      { error: 'Transaction introuvable', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  try {
    const result = await confirmMatchingForBooking(transaction.booking_id, user.id)
    return NextResponse.json(result)
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la confirmation'

    return NextResponse.json({ error: message }, { status })
  }
}
