import { createE2EAdminClient } from './supabase-admin'

export async function createTestBooking(
  senderId: string,
  announcementId: string
): Promise<{ id: string }> {
  const supabase = createE2EAdminClient()

  const { data: announcement } = await supabase
    .from('announcements')
    .select('traveler_id, price_per_kg')
    .eq('id', announcementId)
    .single()

  if (!announcement)
    throw new Error('Announcement not found for seeding booking')

  const kilos = 5

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      sender_id: senderId,
      traveler_id: announcement.traveler_id,
      announcement_id: announcementId,
      kilos_requested: kilos,
      price_per_kg: announcement.price_per_kg || 10,
      status: 'pending',
      package_description: 'Test booking created by E2E',
      qr_code: '',
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to seed booking: ${error?.message}`)
  }

  return { id: data.id }
}

export async function acceptTestBooking(bookingId: string): Promise<void> {
  const supabase = createE2EAdminClient()
  const acceptedAt = new Date().toISOString()
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'accepted',
      accepted_at: acceptedAt,
      traveler_confirmed_at: acceptedAt,
    })
    .eq('id', bookingId)

  if (error) throw new Error(`Failed to accept booking: ${error.message}`)
}

export async function updateTestBookingStatus(
  bookingId: string,
  status: string
): Promise<void> {
  const supabase = createE2EAdminClient()
  const now = new Date().toISOString()
  const patch: Record<string, string | null> = { status }

  if (status === 'paid' || status === 'confirmed') {
    patch.paid_at = now
  }

  if (status === 'deposited') {
    patch.paid_at = now
    patch.deposited_at = now
  }

  if (status === 'delivered' || status === 'completed') {
    patch.paid_at = now
    patch.deposited_at = now
    patch.delivered_at = now
    patch.delivery_confirmed_at = now
    patch.completed_at = now
  }

  const { error } = await supabase
    .from('bookings')
    .update(patch)
    .eq('id', bookingId)

  if (error) {
    throw new Error(`Failed to update booking status: ${error.message}`)
  }
}

export async function deleteTestBookings(senderId: string): Promise<void> {
  const supabase = createE2EAdminClient()
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('sender_id', senderId)
    .eq('package_description', 'Test booking created by E2E')

  const bookingIds = bookings?.map(booking => booking.id) || []

  if (bookingIds.length > 0) {
    await supabase.from('notifications').delete().in('booking_id', bookingIds)
  }

  await supabase
    .from('bookings')
    .delete()
    .eq('sender_id', senderId)
    .eq('package_description', 'Test booking created by E2E')
}
