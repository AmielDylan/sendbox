import { createClient } from '@/lib/shared/db/server'
import { FEATURES } from '@/lib/shared/config/features'

export async function POST(req: Request) {
  if (!FEATURES.BETA_MODE) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = await createClient()
  const body = await req.json()
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!email) {
    return Response.json({ error: 'Email invalide' }, { status: 400 })
  }

  const { error } = await supabase.from('waitlist').insert({ email })

  if (error) {
    return Response.json({ error: 'Email déjà enregistré' }, { status: 400 })
  }

  return Response.json({ success: true })
}
