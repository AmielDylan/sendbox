import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'
import { confirmMatchingForBooking } from '@/lib/core/matching/confirm'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Non authentifié', code: 'UNAUTHENTICATED' },
      { status: 401 }
    )
  }

  try {
    const result = await confirmMatchingForBooking(id, user.id)
    return NextResponse.json(result)
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la confirmation'

    return NextResponse.json({ error: message }, { status })
  }
}
