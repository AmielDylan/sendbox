import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { releaseTransferForBooking } from '@/lib/core/payments/transfers'
import { getPaymentsMode } from '@/lib/shared/config/features'

const AUTO_RELEASE_DAYS = 7

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const headerSecret = req.headers.get('x-cron-secret')

  if (secret && secret !== headerSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (getPaymentsMode() !== 'stripe') {
    return NextResponse.json({ skipped: true, reason: 'payments_disabled' })
  }

  const admin = createAdminClient()
  const startTime = new Date()
  
  // Log job start
  const { data: jobLog } = await (admin as any)
    .from('cron_job_logs')
    .insert({
      job_name: 'auto_release_payouts',
      last_run_at: startTime.toISOString(),
      status: 'running',
    })
    .select()
    .single()

  const threshold = new Date(
    Date.now() - AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  const { data: bookings, error } = await admin
    .from('bookings')
    .select('id, delivered_at, delivery_confirmed_at, status')
    .eq('status', 'delivered')
    .is('delivery_confirmed_at', null)
    .is('dispute_opened_at', null)
    .lte('delivered_at', threshold)

  if (error) {
    // Log error
    if (jobLog?.id) {
      await (admin as any)
        .from('cron_job_logs')
        .update({
          status: 'failed',
          error_message: 'Failed to load bookings',
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobLog.id)
    }
    return NextResponse.json(
      { error: 'Failed to load payments' },
      { status: 500 }
    )
  }

  const bookingIds = Array.from(
    new Set((bookings || []).map(booking => booking.id))
  )

  let processed = 0
  let released = 0
  const errors: Array<{ bookingId: string; error: string }> = []

  for (const bookingId of bookingIds) {
    processed += 1
    try {
      const result = await releaseTransferForBooking(bookingId, 'auto_release')
      if (result.success || result.alreadyTransferred) {
        released += 1
      }
      if (result.error) {
        errors.push({ bookingId, error: result.error })
      }
    } catch (releaseError: any) {
      errors.push({ bookingId, error: releaseError?.message || 'unknown_error' })
    }
  }

  // Log job completion
  if (jobLog?.id) {
    await (admin as any)
      .from('cron_job_logs')
      .update({
        status: 'success',
        processed_count: released,
        next_run_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobLog.id)
  }

  return NextResponse.json({
    processed,
    released,
    errors,
    timestamp: new Date().toISOString(),
  })
}
