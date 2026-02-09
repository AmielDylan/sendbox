import { createClient } from '@/lib/shared/db/server'
import { listFedaPayCountries } from '@/lib/services/fedapay'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
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

  try {
    const result = await listFedaPayCountries()
    return Response.json(result)
  } catch (error) {
    console.error('FedaPay countries error:', error)
    return Response.json(
      { error: 'Impossible de charger les pays FedaPay.' },
      { status: 500 }
    )
  }
}
