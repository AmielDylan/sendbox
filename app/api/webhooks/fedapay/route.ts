import { Webhook } from 'fedapay'
import { createAdminClient } from '@/lib/shared/db/admin'

export const dynamic = 'force-dynamic'

const WEBHOOK_SECRET = process.env.FEDAPAY_WEBHOOK_SECRET

const normalizeTransferStatus = (value?: string | null) => {
  switch ((value || '').toLowerCase()) {
    case 'paid':
    case 'successful':
    case 'success':
    case 'completed':
    case 'approved':
    case 'sent':
    case 'settled':
      return 'paid'
    case 'failed':
    case 'canceled':
    case 'cancelled':
    case 'rejected':
      return 'failed'
    default:
      return 'pending'
  }
}

const extractEventName = (event: any) =>
  event?.name || event?.type || event?.event || event?.event_name

const extractEventObject = (event: any) =>
  event?.entity ||
  event?.data ||
  event?.object ||
  event?.payload ||
  event?.resource ||
  event?.payout ||
  null

export async function POST(req: Request) {
  const rawBody = Buffer.from(await req.arrayBuffer())
  const signature =
    req.headers.get('x-fedapay-signature') ||
    req.headers.get('X-FEDAPAY-SIGNATURE')

  let constructedEvent: any = null
  if (WEBHOOK_SECRET) {
    try {
      constructedEvent = Webhook.constructEvent(
        rawBody,
        signature,
        WEBHOOK_SECRET
      )
    } catch (err: any) {
      console.error('FedaPay webhook signature error:', err?.message || err)
      return Response.json({ error: 'Signature invalide' }, { status: 400 })
    }
  } else {
    console.warn('⚠️ FEDAPAY_WEBHOOK_SECRET is not configured')
  }

  let event: any = constructedEvent
  if (!event) {
    try {
      event = JSON.parse(rawBody.toString('utf8'))
    } catch (err) {
      console.error('FedaPay webhook payload invalid:', err)
      return Response.json({ error: 'Payload invalide' }, { status: 400 })
    }
  }

  const eventName = extractEventName(event)
  const eventObject = extractEventObject(event) || {}
  const payload = eventObject?.object || eventObject

  const payoutId =
    payload?.id ||
    payload?.payout_id ||
    payload?.transaction_id ||
    eventObject?.id ||
    null

  const reference =
    payload?.merchant_reference ||
    payload?.reference ||
    payload?.tx_ref ||
    payload?.meta?.reference ||
    null

  const status =
    payload?.status ||
    payload?.state ||
    payload?.result ||
    eventObject?.status ||
    null

  if (!payoutId && !reference) {
    console.log('🔔 FedaPay webhook received (ignored):', {
      event: eventName,
    })
    return Response.json({ received: true })
  }

  const normalizedStatus = normalizeTransferStatus(status)
  const admin = createAdminClient()

  const findTransfer = async () => {
    if (payoutId) {
      const { data: transfer } = await (admin as any)
        .from('transfers')
        .select('id, booking_id, status')
        .eq('external_transfer_id', payoutId)
        .maybeSingle()
      if (transfer) return transfer
    }

    if (reference) {
      const { data: transfer } = await (admin as any)
        .from('transfers')
        .select('id, booking_id, status')
        .eq('booking_id', reference)
        .maybeSingle()
      if (transfer) return transfer
    }

    return null
  }

  // Handle FedaPay subscription activation on transaction approval
  const isTransactionApproved =
    eventName === 'transaction.approved' ||
    eventName === 'transaction.success'

  if (isTransactionApproved && reference?.startsWith('sub_')) {
    const userId = reference.replace('sub_', '')
    const endsAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString()

    const { error: subError } = await (admin as any)
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_expires_at: endsAt,
      })
      .eq('id', userId)

    if (subError) {
      console.error('❌ FedaPay subscription activation failed:', subError)
    } else {
      console.log('✅ FedaPay subscription activated for user:', userId, 'until:', endsAt)
    }

    return Response.json({ received: true })
  }

  const transfer = await findTransfer()
  if (transfer) {
    if (transfer.status !== normalizedStatus) {
      await (admin as any)
        .from('transfers')
        .update({ status: normalizedStatus })
        .eq('id', transfer.id)
    }

    if (normalizedStatus === 'paid' && transfer.booking_id) {
      await admin
        .from('bookings')
        .update({
          payout_at: new Date().toISOString(),
          payout_id: payoutId || reference,
        })
        .eq('id', transfer.booking_id)
    }
  }

  console.log('🔔 FedaPay webhook processed:', {
    event: eventName,
    payoutId,
    reference,
    status: normalizedStatus,
  })

  return Response.json({ received: true })
}
