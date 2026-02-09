import { createClient } from '@/lib/shared/db/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const rawLimit = Number(searchParams.get('limit') || 10)
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 20)
    : 10

  const { data, error } = await supabase
    .from('announcements')
    .select(
      'id, departure_city, departure_country, arrival_city, arrival_country, departure_date, arrival_date, available_kg, price_per_kg, created_at, status, profiles:profiles (firstname, lastname, avatar_url)'
    )
    .in('status', ['active', 'partially_booked', 'fully_booked'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Latest announcements error:', error)
    return Response.json(
      { error: 'Impossible de charger les annonces récentes.' },
      { status: 500 }
    )
  }

  return Response.json({ data: data ?? [] })
}
