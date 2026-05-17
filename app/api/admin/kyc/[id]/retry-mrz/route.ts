import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { isAdmin } from '@/lib/core/admin/actions'
import { runDocumentOCR } from '@/lib/core/kyc/ocr'

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
    .select('kyc_document_front')
    .eq('id', userId)
    .single()

  if (!profile?.kyc_document_front) {
    return NextResponse.json(
      { error: 'Aucun document disponible' },
      { status: 400 }
    )
  }

  await runDocumentOCR(userId, profile.kyc_document_front as string)

  return NextResponse.json({ ok: true })
}
