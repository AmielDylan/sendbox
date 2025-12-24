/**
 * Page "Mes annonces" dans le dashboard
 */

'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUserAnnouncements } from "@/lib/shared/db/queries/announcements"
import {
  deleteAnnouncement,
  markAnnouncementAsCompleted,
} from "@/lib/core/announcements/management"
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  IconLoader2,
  IconPlus,
  IconMapPin,
  IconCalendar,
  IconPackage,
  IconCurrencyEuro,
  IconEdit,
  IconTrash,
  IconCheck,
  IconEye,
  IconMessage,
} from '@tabler/icons-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/shared/db/client"

type AnnouncementStatus = 'active' | 'draft' | 'completed' | 'cancelled'

export default function MyAnnouncementsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] =
    useState<AnnouncementStatus | 'all'>('active')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<
    string | null
  >(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Récupérer l'utilisateur actuel
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUserId = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUserId()
  }, [])

  // Query pour récupérer les annonces
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['user-announcements', userId, activeTab],
    queryFn: async () => {
      if (!userId) return { data: null, error: null }
      return getUserAnnouncements(
        userId,
        activeTab === 'all' ? undefined : activeTab
      )
    },
    enabled: !!userId,
  })

  const announcements = data?.data || []

  const handleDelete = async () => {
    if (!announcementToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteAnnouncement(announcementToDelete)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success(result.message)
        setDeleteDialogOpen(false)
        setAnnouncementToDelete(null)
        refetch()
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleMarkCompleted = async (announcementId: string) => {
    try {
      const result = await markAnnouncementAsCompleted(announcementId)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success(result.message)
        refetch()
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          title="Mes annonces"
          description="Gérez vos annonces de trajets"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Annonces' },
          ]}
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="active">Publiées</TabsTrigger>
          <TabsTrigger value="draft">Brouillons</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
          <TabsTrigger value="all">Toutes</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : announcements.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Aucune annonce {activeTab === 'all' ? '' : activeTab}.
                </p>
                <div className="mt-4 text-center">
                  <Link href="/dashboard/annonces/new">
                    <Button variant="outline">
                      <IconPlus className="mr-2 h-4 w-4" />
                      Créer une annonce
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {announcements.map((announcement) => (
                <Card key={announcement.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {announcement.origin_city} →{' '}
                          {announcement.destination_city}
                          <Badge
                            variant={
                              announcement.status === 'active'
                                ? 'default'
                                : announcement.status === 'completed'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {announcement.status === 'active'
                              ? 'Publiée'
                              : announcement.status === 'completed'
                                ? 'Terminée'
                                : announcement.status === 'draft'
                                  ? 'Brouillon'
                                  : 'Annulée'}
                          </Badge>
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <IconCalendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(
                            new Date(announcement.departure_date),
                            'd MMM yyyy',
                            { locale: fr }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IconPackage className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {announcement.max_weight_kg} kg
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IconCurrencyEuro className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {announcement.price_per_kg} €/kg
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IconEye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">0 vues</span>
                      </div>
                    </div>

                    {announcement.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {announcement.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      {announcement.status === 'active' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleMarkCompleted(announcement.id)
                            }
                          >
                            <IconCheck className="mr-2 h-4 w-4" />
                            Marquer terminée
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/dashboard/annonces/${announcement.id}/edit`
                              )
                            }
                          >
                            <IconEdit className="mr-2 h-4 w-4" />
                            Éditer
                          </Button>
                        </>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setAnnouncementToDelete(announcement.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <IconTrash className="mr-2 h-4 w-4" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'annonce</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action
              est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setAnnouncementToDelete(null)
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

