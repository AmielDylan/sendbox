import { createClient } from '@/lib/shared/db/server'

export async function POST(req: Request) {
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
