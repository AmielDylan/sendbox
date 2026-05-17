import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { createSystemNotification } from '@/lib/core/notifications/system'
import { sendEmail } from '@/lib/shared/services/email/client'

const DISPUTABLE_STATUSES = [
  'handed',
  'in_transit',
  'delivered',
  'completed',
  'HANDED',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
]

export async function POST(req: NextRequest) {
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

  const body = (await req.json().catch(() => null)) as {
    transactionId?: string
    bookingId?: string
    reason?: string
    description?: string
  } | null

  const bookingId = body?.bookingId ?? body?.transactionId
  const reason = body?.reason?.trim()
  const description = body?.description?.trim()

  if (!bookingId || !reason || !description || description.length < 30) {
    return NextResponse.json(
      { error: 'Données de litige invalides', code: 'INVALID_BODY' },
      { status: 422 }
    )
  }

  const admin = createAdminClient()
  const { data: booking } = await admin
    .from('bookings')
    .select('id, sender_id, traveler_id, status')
    .eq('id', bookingId)
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

  if (!DISPUTABLE_STATUSES.includes(booking.status)) {
    return NextResponse.json(
      { error: 'Statut incompatible', code: 'INVALID_STATUS' },
      { status: 422 }
    )
  }

  const { data: existing } = await admin
    .from('disputes')
    .select('id')
    .eq('booking_id', bookingId)
    .in('status', ['OPEN', 'UNDER_REVIEW', 'open', 'under_review'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      {
        error: 'Un litige est déjà en cours sur cette transaction',
        code: 'DISPUTE_EXISTS',
      },
      { status: 409 }
    )
  }

  const { data: dispute, error: disputeError } = await admin
    .from('disputes')
    .insert({
      booking_id: bookingId,
      opened_by_id: user.id,
      reason,
      description,
      status: 'OPEN',
      is_public: true,
    })
    .select('id')
    .single()

  if (disputeError || !dispute) {
    return NextResponse.json(
      { error: "Erreur lors de l'ouverture du litige" },
      { status: 500 }
    )
  }

  await admin
    .from('bookings')
    .update({ status: 'disputed', is_flagged: true, disputed_reason: reason })
    .eq('id', bookingId)

  await notifyAdmin({
    disputeId: dispute.id,
    bookingId,
    openedById: user.id,
    reason,
    description,
  })

  const otherPartyId = isSender ? booking.traveler_id : booking.sender_id

  await createSystemNotification({
    userId: otherPartyId,
    type: 'system_alert',
    title: 'Un litige a été ouvert vous concernant',
    content:
      "Ce litige est visible sur votre profil public pendant l'instruction.",
    bookingId,
  })
  ;(async () => {
    const { data: otherProfile } = await admin
      .from('profiles')
      .select('email, firstname')
      .eq('id', otherPartyId)
      .single()
    if (otherProfile?.email) {
      await sendEmail({
        to: otherProfile.email,
        subject: '[Litige] Une contestation a été ouverte sur votre envoi',
        template: 'notification',
        data: {
          title: 'Un litige vous concerne',
          content: `${otherProfile.firstname ? `Bonjour ${otherProfile.firstname},\n\n` : ''}Une contestation a été ouverte sur une réservation vous concernant. Ce litige est visible sur votre profil public pendant l'instruction.\n\nMotif : ${reason}`,
          ctaText: 'Voir la réservation',
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/colis/${bookingId}`,
        },
      })
    }
  })().catch(console.error)

  return NextResponse.json({ disputeId: dispute.id })
}

async function notifyAdmin({
  disputeId,
  bookingId,
  openedById,
  reason,
  description,
}: {
  disputeId: string
  bookingId: string
  openedById: string
  reason: string
  description: string
}) {
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  await sendEmail({
    to: adminEmail,
    subject: `[Litige ouvert] ${bookingId}`,
    template: 'notification',
    data: {
      title: `[Litige ouvert] ${bookingId}`,
      content: [
        `Plaignant   : ${openedById}`,
        `Réservation : ${bookingId}`,
        `Raison      : ${reason}`,
        `Description : ${description}`,
        `Dashboard   : ${appUrl}/admin/disputes/${disputeId}`,
      ].join('\n'),
    },
  })
}
