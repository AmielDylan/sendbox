import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/core/admin/actions'
import { createAdminClient } from '@/lib/shared/db/admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  await params

  let signedUrl: string
  let documentType: string
  try {
    ;({ signedUrl, documentType } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  if (!signedUrl || !documentType) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin.functions.invoke('kyc-ocr', {
    body: { signedUrl, documentType },
  })

  if (error) {
    console.error('[kyc/ocr] Edge function error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
