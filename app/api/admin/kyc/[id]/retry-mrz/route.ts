import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { isAdmin } from '@/lib/core/admin/actions'
import { processKYCMRZ } from '@/lib/core/kyc/mrz'

export const maxDuration = 60

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser()
  if (!adminUser || !(await isAdmin())) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { id: userId } = await params
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('kyc_document_front, kyc_document_back')
    .eq('id', userId)
    .single()

  if (!profile?.kyc_document_front) {
    return NextResponse.json(
      { error: 'Aucun document disponible' },
      { status: 400 }
    )
  }

  const { data: reviews } = await admin
    .from('kyc_reviews')
    .select('doc_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  const docType = (reviews?.[0] as any)?.doc_type as string | null

  const mrzPrimaryPath =
    docType === 'cni' && profile.kyc_document_back
      ? (profile.kyc_document_back as string)
      : (profile.kyc_document_front as string)
  const mrzFallbackPath =
    docType === 'passport' && profile.kyc_document_back
      ? (profile.kyc_document_back as string)
      : undefined

  await processKYCMRZ(userId, mrzPrimaryPath, mrzFallbackPath)

  return NextResponse.json({ ok: true })
}
