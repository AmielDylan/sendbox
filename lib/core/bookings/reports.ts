'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { createSystemNotification } from '@/lib/core/notifications/system'
import {
  formatBookingReportReason,
  isBookingReportReason,
} from '@/lib/core/bookings/report-policy'

const OPEN_REPORT_STATUSES = ['open', 'reviewing']

function normalizeMessage(message: string) {
  return message.trim().replace(/\s+/g, ' ')
}

export async function createBookingReport(input: {
  bookingId: string
  reason: string
  message: string
  suggestedNewDate?: string | null
}) {
  const supabase = await createClient()
  const reason = input.reason.trim()
  const message = normalizeMessage(input.message)
  const suggestedNewDate = input.suggestedNewDate?.trim() || null

  if (!isBookingReportReason(reason)) {
    return { error: 'Choisissez un motif de signalement.' }
  }

  if (message.length < 20) {
    return {
      error: 'Decrivez la situation en au moins 20 caracteres.',
    }
  }

  if (message.length > 700) {
    return {
      error: 'Le signalement est trop long. Limite : 700 caracteres.',
    }
  }

  if (reason === 'travel_postponed' && !suggestedNewDate) {
    return {
      error: 'Indiquez la nouvelle date proposee pour un voyage reporte.',
    }
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Vous devez etre connecte.' }
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, sender_id, traveler_id, announcement_id')
    .eq('id', input.bookingId)
    .single()

  if (bookingError || !booking) {
    return { error: 'Reservation introuvable.' }
  }

  const isSender = booking.sender_id === user.id
  const isTraveler = booking.traveler_id === user.id

  if (!isSender && !isTraveler) {
    return {
      error: "Vous n'etes pas autorise a signaler cette reservation.",
    }
  }

  if (booking.status === 'cancelled') {
    return {
      error: 'Cette reservation est deja annulee.',
    }
  }

  const { data: existingReport, error: existingError } = await supabase
    .from('booking_reports')
    .select('id')
    .eq('booking_id', input.bookingId)
    .eq('reported_by', user.id)
    .in('status', OPEN_REPORT_STATUSES)
    .maybeSingle()

  if (existingError) {
    console.error('Error checking existing booking report:', existingError)
    return {
      error: 'Impossible de verifier les signalements existants.',
    }
  }

  if (existingReport) {
    return {
      error: 'Un signalement est deja ouvert par vous sur cette reservation.',
    }
  }

  const reportedUserId = isSender ? booking.traveler_id : booking.sender_id

  const { data: report, error: insertError } = await supabase
    .from('booking_reports')
    .insert({
      booking_id: input.bookingId,
      reported_by: user.id,
      reported_user_id: reportedUserId,
      reason,
      message,
      suggested_new_date: suggestedNewDate,
      status: 'open',
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Error creating booking report:', insertError)
    return {
      error: "Erreur lors de l'envoi du signalement.",
    }
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminClient = createAdminClient()
      const { data: admins } = await adminClient
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      await Promise.all(
        (admins || []).map(admin =>
          createSystemNotification({
            userId: admin.id,
            type: 'system_alert',
            title: 'Signalement reservation',
            content: `${isSender ? "L'expediteur" : 'Le voyageur'} a signale un imprevu : ${formatBookingReportReason(reason)}.`,
            bookingId: input.bookingId,
            announcementId: booking.announcement_id,
            link: `/admin/bookings`,
          })
        )
      )
    } catch (notificationError) {
      console.warn(
        'Admin booking report notification failed:',
        notificationError
      )
    }
  }

  revalidatePath('/dashboard/colis')
  revalidatePath(`/dashboard/colis/${input.bookingId}`)
  revalidatePath('/admin/bookings')

  return {
    success: true,
    reportId: report?.id ?? null,
    message: 'Signalement envoye.',
  }
}
