/**
 * Page "Mes annonces" dans le dashboard
 */

'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUserAnnouncements } from '@/lib/shared/db/queries/announcements'
import {
  deleteAnnouncement,
  markAnnouncementAsCompleted,
  toggleAnnouncementStatus,
} from '@/lib/core/announcements/management'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
  IconCalendar,
  IconPackage,
  IconEdit,
  IconTrash,
  IconCheck,
  IconEye,
  IconArrowNarrowRight,
} from '@tabler/icons-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/shared/db/client'
import { useAuth } from '@/hooks/use-auth'
import { ClientOnly } from '@/components/ui/client-only'
import { getCountryName } from '@/lib/utils/countries'

type AnnouncementStatus = 'active' | 'draft' | 'completed' | 'cancelled'

export default function MyAnnouncementsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<AnnouncementStatus | 'all'>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<
    string | null
  >(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null)

  // Query pour récupérer les annonces
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['user-announcements', activeTab],
    queryFn: async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      let effectiveUserId = user?.id || session?.user?.id

      if (!effectiveUserId) {
        const { data: refreshed } = await supabase.auth.refreshSession()
        effectiveUserId = refreshed.session?.user?.id
      }

      if (!effectiveUserId) return { data: null, error: null }
      return getUserAnnouncements(
        effectiveUserId,
        activeTab === 'all' ? undefined : activeTab
      )
    },
  })

  const announcements = data?.data || []
  const emptyTitle =
    activeTab === 'draft'
      ? 'Aucun brouillon'
      : activeTab === 'completed'
        ? 'Aucune annonce terminée'
        : activeTab === 'active'
          ? 'Aucune annonce publiée'
          : 'Aucune annonce'

  // Gérer le rafraîchissement après création (Safari)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('refresh') === 'true') {
        refetch()
        window.history.replaceState({}, '', '/dashboard/annonces')
      }
    }
  }, [refetch])

  useEffect(() => {
    if (user?.id) {
      refetch()
    }
  }, [user?.id, refetch])

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
    } catch {
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
        toast.success(
          'Annonce marquée comme terminée. Elle est maintenant dans l\'onglet "Terminées".'
        )
        // Changer vers l'onglet "Terminées" pour montrer le résultat
        setActiveTab('completed')
      }
    } catch {
      toast.error('Une erreur est survenue')
    }
  }

  const handleToggleStatus = async (announcementId: string) => {
    setIsUpdatingStatus(announcementId)
    try {
      const result = await toggleAnnouncementStatus(announcementId)

      if (result.error) {
        toast.error(result.error)
        if ((result as any).field === 'kyc') {
          router.push('/dashboard/reglages/kyc')
        }
        return
      }

      if (result.success) {
        toast.success(result.message)
        refetch()
      }
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setIsUpdatingStatus(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Mes annonces"
          description="Gérez vos annonces de trajets"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Annonces' },
          ]}
          actions={
            announcements.length > 0 ? (
              <Link href="/dashboard/annonces/new">
                <Button className="shadow-warm hover:shadow-xl transition-all hover:-translate-y-0.5">
                  <IconPlus className="mr-2 h-4 w-4" />
                  Nouvelle annonce
                </Button>
              </Link>
            ) : undefined
          }
        />
      </div>

      <ClientOnly
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="active">Publiées</TabsTrigger>
            <TabsTrigger value="draft">Brouillons</TabsTrigger>
            <TabsTrigger value="completed">Terminées</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : announcements.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="pt-12 pb-12">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                      <IconPackage className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg text-foreground">{emptyTitle}</p>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Créez votre première annonce pour proposer un trajet
                      </p>
                    </div>
                    <Link href="/dashboard/annonces/new" className="mt-2">
                      <Button className="shadow-warm hover:shadow-xl transition-all hover:-translate-y-0.5">
                        <IconPlus className="mr-2 h-4 w-4" />
                        Créer une annonce
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {announcements.map(announcement => (
                  <Card
                    key={announcement.id}
                    className="rounded-xl border border-border/60 shadow-none hover:border-primary/40 hover:bg-muted/30 transition-all duration-300 group overflow-hidden flex flex-col"
                  >
                    <CardHeader className="p-5 pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="font-bold text-xl sm:text-2xl text-foreground flex flex-wrap items-center gap-2 group-hover:text-primary transition-colors">
                            <span>{announcement.departure_city}</span>
                            <span className="text-muted-foreground font-normal text-base mx-1">
                              ({getCountryName(announcement.departure_country)})
                            </span>
                            <IconArrowNarrowRight
                              className="h-6 w-6 text-muted-foreground/50"
                              stroke={1}
                            />
                            <span>{announcement.arrival_city}</span>
                            <span className="text-muted-foreground font-normal text-base mx-1">
                              ({getCountryName(announcement.arrival_country)})
                            </span>
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium text-primary">
                              {announcement.price_per_kg} €
                            </span>{' '}
                            / kg
                            <span>•</span>
                            <span>
                              {announcement.available_kg} kg disponibles
                            </span>
                          </div>
                        </div>

                        <Badge
                          variant={
                            announcement.status === 'active' ||
                            announcement.status === 'partially_booked'
                              ? 'default'
                              : announcement.status === 'fully_booked' ||
                                  announcement.status === 'completed'
                                ? 'secondary'
                                : announcement.status === 'cancelled'
                                  ? 'destructive'
                                  : 'outline'
                          }
                          className="w-fit whitespace-nowrap px-3 py-1 text-xs font-medium"
                        >
                          {announcement.status === 'active'
                            ? 'Publiée'
                            : announcement.status === 'partially_booked'
                              ? 'Partiellement réservée'
                              : announcement.status === 'fully_booked'
                                ? 'Complète'
                                : announcement.status === 'completed'
                                  ? 'Terminée'
                                  : announcement.status === 'draft'
                                    ? 'Brouillon'
                                    : announcement.status === 'cancelled'
                                      ? 'Annulée'
                                      : announcement.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 py-2 flex-1 space-y-4">
                      {/* Data Badges Grid */}
                      <div className="flex flex-wrap gap-2 w-full">
                        {/* Date Badge */}
                        <div className="flex flex-col items-start justify-center px-3 py-2 rounded-lg bg-background/50 border border-border/50 min-w-[120px]">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">
                            Départ
                          </span>
                          <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                            <IconCalendar className="h-3.5 w-3.5 text-primary/70" />
                            {format(
                              new Date(announcement.departure_date),
                              'd MMM yyyy',
                              { locale: fr }
                            )}
                          </div>
                        </div>

                        {/* Arrival Date if exists (simulated or real) */}
                        <div className="flex flex-col items-start justify-center px-3 py-2 rounded-lg bg-background/50 border border-border/50 min-w-[120px]">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">
                            Arrivée
                          </span>
                          <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                            <IconCalendar className="h-3.5 w-3.5 text-primary/70" />
                            {announcement.arrival_date
                              ? format(
                                  new Date(announcement.arrival_date),
                                  'd MMM yyyy',
                                  { locale: fr }
                                )
                              : '-'}
                          </div>
                        </div>

                        {/* Views Badge */}
                        <div className="flex flex-col items-start justify-center px-3 py-2 rounded-lg bg-background/50 border border-border/50 min-w-[80px]">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">
                            Vues
                          </span>
                          <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                            <IconEye className="h-3.5 w-3.5 text-muted-foreground" />
                            {announcement.views_count || 0}
                          </div>
                        </div>
                      </div>

                      {announcement.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed pl-1 border-l-2 border-primary/20">
                          {announcement.description}
                        </p>
                      )}
                    </CardContent>

                    <div className="p-4 sm:p-5 mt-auto border-t border-border/30 bg-muted/20 flex flex-col sm:flex-row gap-2 sm:items-center justify-end">
                      {announcement.status === 'active' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 hover:border-green-200 transition-all font-medium"
                            onClick={() => handleMarkCompleted(announcement.id)}
                          >
                            <IconCheck className="mr-2 h-3.5 w-3.5" />
                            Terminée
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all font-medium"
                            onClick={() =>
                              router.push(
                                `/dashboard/annonces/${announcement.id}/edit`
                              )
                            }
                          >
                            <IconEdit className="mr-2 h-3.5 w-3.5" />
                            Modifier
                          </Button>
                        </>
                      )}
                      {announcement.status === 'draft' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all font-medium"
                            onClick={() =>
                              router.push(
                                `/dashboard/annonces/${announcement.id}/edit`
                              )
                            }
                          >
                            <IconEdit className="mr-2 h-3.5 w-3.5" />
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            className="h-9"
                            onClick={() => handleToggleStatus(announcement.id)}
                            disabled={isUpdatingStatus === announcement.id}
                          >
                            {isUpdatingStatus === announcement.id ? (
                              <>
                                <IconLoader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                Publication...
                              </>
                            ) : (
                              <>
                                <IconCheck className="mr-2 h-3.5 w-3.5" />
                                Publier
                              </>
                            )}
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all font-medium"
                        onClick={() => {
                          setAnnouncementToDelete(announcement.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <IconTrash className="mr-2 h-3.5 w-3.5" />
                        Supprimer
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </ClientOnly>

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
