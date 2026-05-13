import { NextRequest, NextResponse } from 'next/server'
import { runWeeklyTrustScan } from '@/lib/jobs/weekly-trust-scan'
import { runDailyReviewExpiry } from '@/lib/jobs/daily-review-expiry'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const job = searchParams.get('job')

  if (job === 'weekly-trust-scan') {
    const result = await runWeeklyTrustScan()
    return NextResponse.json({ job, ...result })
  }

  if (job === 'daily-review-expiry') {
    const result = await runDailyReviewExpiry()
    return NextResponse.json({ job, ...result })
  }

  // Sans paramètre : exécuter tous les jobs selon le jour
  const day = new Date().getDay() // 0 = dimanche
  const results: Record<string, unknown> = {}

  results['daily-review-expiry'] = await runDailyReviewExpiry()

  if (day === 0) {
    results['weekly-trust-scan'] = await runWeeklyTrustScan()
  }

  return NextResponse.json({ jobs: results })
}
