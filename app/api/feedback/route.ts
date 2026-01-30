import { createClient } from '@/lib/shared/db/server'

const ALLOWED_TYPES = new Set(['bug', 'feature', 'other'])

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await req.json()
  const type = typeof body?.type === 'string' ? body.type : 'other'
  const message = typeof body?.message === 'string' ? body.message.trim() : ''

  if (!ALLOWED_TYPES.has(type)) {
    return Response.json({ error: 'Type invalide' }, { status: 400 })
  }

  if (!message) {
    return Response.json({ error: 'Message requis' }, { status: 400 })
  }

  const { error } = await supabase.from('feedback').insert({
    user_id: user.id,
    type,
    message,
  })

  if (error) {
    return Response.json({ error: 'Erreur lors de l’envoi' }, { status: 400 })
  }

  return Response.json({ success: true })
}
