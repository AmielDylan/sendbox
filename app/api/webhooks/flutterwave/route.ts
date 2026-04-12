import crypto from 'crypto'
import { createAdminClient } from '@/lib/shared/db/admin'

export const dynamic = 'force-dynamic'

const WEBHOOK_SECRET = process.env.FLUTTERWAVE_WEBHOOK_SECRET

const safeCompare = (a: string, b: string) => {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return crypto.timingSafeEqual(bufferA, bufferB)
}

const normalizeFlutterwaveStatus = (value: string | null | undefined) => {
  switch ((value || '').toLowerCase()) {
    case 'successful':
    case 'success':
    case 'completed':
    case 'paid':
    case 'sent':
    case 'approved':
    case 'settled':
      return 'paid'
    case 'failed':
    case 'error':
    case 'cancelled':
    case 'canceled':
      return 'failed'
    default:
      return 'pending'
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text()

  if (WEBHOOK_SECRET) {
    const signature = req.headers.get('flutterwave-signature')
    const verifHash = req.headers.get('verif-hash')

    let isValid = false
    if (signature) {
      const expected = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex')
      isValid = safeCompare(expected, signature)
    }

    if (!isValid && verifHash) {
      isValid = safeCompare(WEBHOOK_SECRET, verifHash)
    }

    if (!isValid) {
      return Response.json({ error: 'Signature invalide' }, { status: 401 })
    }
  } else {
    console.warn('⚠️ FLUTTERWAVE_WEBHOOK_SECRET is not configured')
  }

  let payload: any = null
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: 'Payload invalide' }, { status: 400 })
  }

  const eventType = payload?.event || payload?.type
  const data = payload?.data || payload?.data?.object || null

  if (!data) {
    return Response.json({ received: true })
  }

  const transferId = data?.id || data?.transfer?.id || data?.transfer_id || null
  const bookingReference = data?.reference || data?.tx_ref || null
  const status = data?.status

  if (eventType?.includes('transfer') || transferId || bookingReference) {
    const normalizedStatus = normalizeFlutterwaveStatus(status)
    const admin = createAdminClient()

    const findTransfer = async () => {
      if (transferId) {
        const { data: transfer } = await (admin as any)
          .from('transfers')
          .select('id, booking_id, status')
          .eq('external_transfer_id', transferId)
          .maybeSingle()
        if (transfer) return transfer
      }

      if (bookingReference) {
        const { data: transfer } = await (admin as any)
          .from('transfers')
          .select('id, booking_id, status')
          .eq('booking_id', bookingReference)
          .maybeSingle()
        if (transfer) return transfer
      }

      return null
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
            payout_id: transferId || bookingReference,
          })
          .eq('id', transfer.booking_id)
      }
    }
  }

  return Response.json({ received: true })
}
