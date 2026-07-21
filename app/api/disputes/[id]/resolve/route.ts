import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/core/admin/actions'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { computeAndSaveTrustScore } from '@/lib/trust/score'
import {
  OPEN_DISPUTE_STATUSES,
  isOpenDisputeStatus,
} from '@/lib/core/disputes/policy'

const statusMap = {
  SENDER: 'RESOLVED_SENDER',
  TRAVELER: 'RESOLVED_TRAVELER',
  MUTUAL: 'RESOLVED_MUTUAL',
  DISMISSED: 'DISMISSED',
} as const

type Outcome = keyof typeof statusMap

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: 'Non autorisé', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

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

  const body = (await req.json().catch(() => null)) as {
    resolution?: string
    outcome?: Outcome
    permanentBan?: boolean
  } | null

  if (!body?.resolution || !body.outcome || !(body.outcome in statusMap)) {
    return NextResponse.json(
      { error: 'Données de résolution invalides', code: 'INVALID_BODY' },
      { status: 422 }
    )
  }

  const admin = createAdminClient()
  const { data: dispute } = await admin
    .from('disputes')
    .select(
      'id, booking_id, status, bookings:booking_id(sender_id, traveler_id)'
    )
    .eq('id', id)
    .single()

  if (!dispute) {
    return NextResponse.json(
      { error: 'Litige introuvable', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  if (!isOpenDisputeStatus(dispute.status)) {
    return NextResponse.json(
      { error: 'Ce litige est deja cloture', code: 'ALREADY_RESOLVED' },
      { status: 409 }
    )
  }

  const status = statusMap[body.outcome]
  const booking = Array.isArray((dispute as any).bookings)
    ? (dispute as any).bookings[0]
    : (dispute as any).bookings

  const { data: updatedRows, error: updateError } = await admin
    .from('disputes')
    .update({
      status,
      resolution: body.resolution,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
      is_public: body.outcome !== 'DISMISSED',
    })
    .eq('id', id)
    .in('status', [...OPEN_DISPUTE_STATUSES])
    .select('id')

  if (updateError || !updatedRows?.length) {
    return NextResponse.json(
      { error: 'Ce litige est deja cloture', code: 'ALREADY_RESOLVED' },
      { status: 409 }
    )
  }

  const loserId =
    status === 'RESOLVED_SENDER'
      ? booking?.sender_id
      : status === 'RESOLVED_TRAVELER'
        ? booking?.traveler_id
        : null

  if (loserId) {
    await (admin.rpc as any)('increment_dispute_count', { p_user_id: loserId })
    await computeAndSaveTrustScore(loserId)
  }

  if (body.permanentBan && loserId) {
    await admin
      .from('profiles')
      .update({ is_suspended: true, suspended_reason: body.resolution })
      .eq('id', loserId)
  }

  return NextResponse.json({ ok: true })
}
