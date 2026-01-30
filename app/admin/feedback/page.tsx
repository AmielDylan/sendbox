/**
 * Feedbacks beta - Admin
 */

import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/core/admin/actions'
import { createAdminClient } from '@/lib/shared/db/admin'
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

  const supabase = createAdminClient()
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
          const fullName = profile
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
                  <Badge className={getFeedbackBadgeClass(feedback.type)}>
                    {formatFeedbackType(feedback.type)}
                  </Badge>
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

function formatFeedbackType(type: string) {
  switch (type) {
    case 'bug':
      return 'Bug'
    case 'feature':
      return 'Suggestion'
    default:
      return 'Autre'
  }
}

function getFeedbackBadgeClass(type: string) {
  switch (type) {
    case 'bug':
      return 'border border-red-200 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200'
    case 'feature':
      return 'border border-blue-200 bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
    default:
      return 'border border-slate-200 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-200'
  }
}
