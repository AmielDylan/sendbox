import { createClient } from '@/lib/shared/db/server'
import { listFlutterwaveBanks } from '@/lib/services/flutterwave'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('country, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return Response.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  if (profile.role === 'admin') {
    return Response.json(
      { error: 'Accès réservé aux utilisateurs' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const requestedCountry = searchParams.get('country')?.toUpperCase()
  const country = requestedCountry || profile.country

  if (!country) {
    return Response.json({ error: 'Pays requis' }, { status: 400 })
  }

  try {
    const response = await listFlutterwaveBanks(country)
    return Response.json({ data: response?.data ?? [] })
  } catch (error) {
    console.error('Flutterwave banks error:', error)
    return Response.json(
      { error: 'Impossible de charger les banques.' },
      { status: 500 }
    )
  }
}
