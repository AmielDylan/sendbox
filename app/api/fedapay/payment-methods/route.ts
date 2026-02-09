import { createClient } from '@/lib/shared/db/server'
import { listFedaPayPaymentMethods } from '@/lib/services/fedapay'

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
    .select('role, country')
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
  const country = requestedCountry || profile.country || 'BJ'

  try {
    const result = await listFedaPayPaymentMethods(country)
    return Response.json(result)
  } catch (error) {
    console.error('FedaPay payment methods error:', error)
    return Response.json(
      { error: 'Impossible de charger les méthodes FedaPay.' },
      { status: 500 }
    )
  }
}
