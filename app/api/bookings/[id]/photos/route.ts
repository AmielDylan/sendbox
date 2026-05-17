import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { createHash } from 'crypto'

const MAX_PHOTO_SIZE_BYTES =
  parseInt(process.env.MAX_PHOTO_SIZE_MB || '10', 10) * 1024 * 1024

const UPLOAD_SECRET = process.env.UPLOAD_SECRET

export async function POST(
  req: NextRequest,
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

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('is_suspended')
    .eq('id', user.id)
    .single()

  if (profile?.is_suspended) {
    return NextResponse.json(
      { error: 'Compte suspendu', code: 'SUSPENDED' },
      { status: 403 }
    )
  }

  const { data: booking } = await admin
    .from('bookings')
    .select('id, sender_id, traveler_id, status')
    .eq('id', id)
    .single()

  if (!booking) {
    return NextResponse.json(
      { error: 'Réservation introuvable', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const isSender = booking.sender_id === user.id
  const isTraveler = booking.traveler_id === user.id

  if (!isSender && !isTraveler) {
    return NextResponse.json(
      { error: 'Accès non autorisé', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  if (!['confirmed', 'handed', 'in_transit'].includes(booking.status)) {
    return NextResponse.json(
      {
        error: 'Statut incompatible pour upload photo',
        code: 'INVALID_STATUS',
      },
      { status: 422 }
    )
  }

  let body: {
    url: string
    type: 'handoff' | 'delivery'
    sizeBytes: number
    uploadSecret?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide', code: 'BAD_REQUEST' },
      { status: 400 }
    )
  }

  if (UPLOAD_SECRET && body.uploadSecret !== UPLOAD_SECRET) {
    return NextResponse.json(
      { error: 'Secret upload invalide', code: 'INVALID_SECRET' },
      { status: 403 }
    )
  }

  if (!body.url || !body.type || !['handoff', 'delivery'].includes(body.type)) {
    return NextResponse.json(
      { error: 'Paramètres manquants ou invalides', code: 'BAD_REQUEST' },
      { status: 400 }
    )
  }

  if (body.sizeBytes > MAX_PHOTO_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'Fichier trop volumineux', code: 'FILE_TOO_LARGE' },
      { status: 413 }
    )
  }

  // capturedAt est TOUJOURS généré serveur — jamais extrait des métadonnées EXIF
  const capturedAt = new Date().toISOString()
  const fileHash = createHash('sha256')
    .update(body.url + capturedAt)
    .digest('hex')

  const { error } = await admin.from('booking_photos').insert({
    booking_id: id,
    uploaded_by_id: user.id,
    type: body.type,
    url: body.url,
    file_hash: fileHash,
    captured_at: capturedAt,
    size_bytes: body.sizeBytes,
  })

  if (error) {
    console.error('booking_photos insert error:', error)
    return NextResponse.json(
      {
        error: "Erreur lors de l'enregistrement de la photo",
        code: 'DB_ERROR',
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, capturedAt })
}
