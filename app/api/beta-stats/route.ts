import { FEATURES } from '@/lib/shared/config/features'
import { createAdminClient } from '@/lib/shared/db/admin'

export async function GET() {
  if (!FEATURES.BETA_MODE) {
    return Response.json({ enabled: false })
  }

  try {
    const admin = createAdminClient()
    const { count, error } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error fetching beta stats:', error)
      return Response.json(
        { error: 'Erreur de chargement' },
        { status: 500 }
      )
    }

    return Response.json({
      enabled: true,
      count: count ?? 0,
      max: FEATURES.MAX_BETA_USERS,
    })
  } catch (error) {
    console.error('Error creating admin client for beta stats:', error)
    return Response.json(
      { error: 'Erreur de configuration' },
      { status: 500 }
    )
  }
}
