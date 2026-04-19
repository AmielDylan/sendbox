import { createE2EAdminClient } from './supabase-admin'

export async function cleanupTestData(travelerId: string, senderId: string): Promise<void> {
  const supabase = createE2EAdminClient()

  await supabase
    .from('bookings')
    .delete()
    .eq('sender_id', senderId)
    .eq('package_description', 'Test booking created by E2E')

  await supabase
    .from('announcements')
    .delete()
    .eq('traveler_id', travelerId)
    .eq('description', 'Test announcement created by E2E')
}
