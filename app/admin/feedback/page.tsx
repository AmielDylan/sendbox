/**
 * Feedbacks beta - Admin
 */

import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/core/admin/actions'
import { createClient } from '@/lib/shared/db/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconMessageCircle } from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function AdminFeedbackPage() {
  const admin = await isAdmin()

  if (!admin) {
    redirect('/')
  }

  const supabase = await createClient()
  const { data: feedbacks, error } = await supabase
    .from('feedback')
    .select(
      `
        id,
        type,
        message,
        created_at,
        user_id,
        profiles:profiles (
          firstname,
          lastname,
          email
        )
      `
    )
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Feedback</h1>
        <p className="text-sm text-destructive">
          Erreur lors du chargement des feedbacks.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Feedback Beta</h1>
        <p className="text-muted-foreground">
          Centralisez les retours utilisateurs.
        </p>
      </div>

      {(!feedbacks || feedbacks.length === 0) && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <IconMessageCircle className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">
              Aucun feedback pour le moment
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      <div className="space-y-4">
        {(feedbacks || []).map((feedback: any) => {
          const profile = feedback.profiles || null
          const fullName =
            profile
              ? `${profile.firstname || ''} ${profile.lastname || ''}`.trim() ||
                profile.email ||
                'Utilisateur'
              : 'Utilisateur'

          return (
            <Card key={feedback.id}>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{fullName}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {profile?.email || 'Email indisponible'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{feedback.type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {feedback.created_at
                      ? format(
                          new Date(feedback.created_at),
                          'dd MMM yyyy • HH:mm',
                          { locale: fr }
                        )
                      : ''}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">{feedback.message}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
