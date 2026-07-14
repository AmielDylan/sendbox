import { NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'

function resolveVerificationStatus(profile: {
  verification_status?: string | null
  kyc_status?: string | null
}) {
  if (profile.verification_status === 'verified') return 'verified'
  if (profile.verification_status === 'pending') return 'pending'
  if (profile.verification_status === 'rejected') return 'rejected'

  if (profile.kyc_status === 'approved') return 'verified'
  if (profile.kyc_status === 'pending') return 'pending'
  if (profile.kyc_status === 'rejected') return 'rejected'

  return 'none'
}

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
    status: resolveVerificationStatus(profile || {}),
    rejectionReason: profile?.kyc_rejection_reason ?? null,
  })
}
