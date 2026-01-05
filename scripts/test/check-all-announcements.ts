import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkAnnouncements() {
  // Toutes les annonces sans filtre de statut
  const { data, error } = await supabase
    .from('announcements')
    .select('id, departure_city, arrival_city, departure_date, status, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Total announcements in DB:', data?.length || 0)
  console.log('')

  data?.forEach((ann, i) => {
    console.log(`${i + 1}. ${ann.departure_city} -> ${ann.arrival_city}`)
    console.log(`   Status: ${ann.status}`)
    console.log(`   Departure: ${ann.departure_date}`)
    console.log(`   Created: ${ann.created_at}`)
    console.log('')
  })
}

checkAnnouncements().then(() => process.exit(0))
