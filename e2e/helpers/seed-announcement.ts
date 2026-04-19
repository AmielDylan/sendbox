import { createE2EAdminClient } from './supabase-admin'

export async function createTestAnnouncement(travelerId: string): Promise<{ id: string }> {
  const supabase = createE2EAdminClient()

  const departureDate = new Date()
  departureDate.setDate(departureDate.getDate() + 14)
  const arrivalDate = new Date(departureDate)
  arrivalDate.setDate(arrivalDate.getDate() + 1)

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      traveler_id: travelerId,
      departure_country: 'FR',
      departure_city: 'Paris',
      arrival_country: 'BJ',
      arrival_city: 'Cotonou',
      departure_date: departureDate.toISOString(),
      arrival_date: arrivalDate.toISOString(),
      available_kg: 20,
      price_per_kg: 10,
      status: 'active',
      description: 'Test announcement created by E2E',
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to seed announcement: ${error?.message}`)
  }

  return { id: data.id }
}

export async function deleteTestAnnouncements(travelerId: string): Promise<void> {
  const supabase = createE2EAdminClient()
  await supabase
    .from('announcements')
    .delete()
    .eq('traveler_id', travelerId)
    .eq('description', 'Test announcement created by E2E')
}
