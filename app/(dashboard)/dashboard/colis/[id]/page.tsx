import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/shared/db/server'
import BookingDetailClient from './BookingDetailClient'
import type { BookingDetail } from './BookingDetailClient'
import {
  getPublicProfiles,
  mapPublicProfilesById,
} from '@/lib/shared/db/queries/public-profiles'

interface BookingDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      announcement:announcement_id (
        departure_country,
        departure_city,
        arrival_country,
        arrival_city,
        departure_date,
        arrival_date
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !booking) {
    notFound()
  }

  if (booking.sender_id !== user.id && booking.traveler_id !== user.id) {
    notFound()
  }

  const { data: publicProfiles } = await getPublicProfiles(supabase, [
    booking.sender_id,
    booking.traveler_id,
  ])
  const profileById = mapPublicProfilesById(publicProfiles || [])
  const initialBooking = {
    ...booking,
    sender: profileById[booking.sender_id] || null,
    traveler: profileById[booking.traveler_id] || null,
  } as BookingDetail

  return (
    <BookingDetailClient
      bookingId={id}
      currentUserId={user.id}
      initialBooking={initialBooking}
    />
  )
}
