import type { KYCStatus } from '@/types'

type VerificationStatus = 'verified' | 'pending' | 'rejected' | string | null

export function resolveKycStatus(profile: {
  verification_status?: VerificationStatus
  kyc_status?: KYCStatus | string | null
}): KYCStatus | null {
  if (profile.verification_status === 'verified') return 'approved'
  if (profile.verification_status === 'pending') return 'pending'
  if (profile.verification_status === 'rejected') return 'rejected'

  if (
    profile.kyc_status === 'approved' ||
    profile.kyc_status === 'pending' ||
    profile.kyc_status === 'rejected' ||
    profile.kyc_status === 'incomplete'
  ) {
    return profile.kyc_status
  }

  return null
}

export function resolveKycApiStatus(profile: {
  verification_status?: VerificationStatus
  kyc_status?: KYCStatus | string | null
}) {
  const status = resolveKycStatus(profile)

  if (status === 'approved') return 'verified'
  if (status === 'pending') return 'pending'
  if (status === 'rejected') return 'rejected'

  return 'none'
}
