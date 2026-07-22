import { NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'
import { resolveKycApiStatus } from '@/lib/core/kyc/status'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('verification_status, kyc_status, kyc_rejection_reason')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json(
      { error: 'Unable to load KYC status' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    status: resolveKycApiStatus(profile || {}),
    rejectionReason: profile?.kyc_rejection_reason ?? null,
  })
}
