/**
 * Page modération annonces admin
 */

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  rejectAnnouncement,
  getAdminAnnouncements,
} from '@/lib/core/admin/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import {
  IconLoader2,
  IconCircleX,
  IconDotsVertical,
  IconLuggage,
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { PageHeader } from '@/components/ui/page-header'

export default function AdminAnnouncementsPage() {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [reason, setReason] = useState('')

  const {
    data: announcements,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['adminAnnouncements'],
    retry: 1,
    queryFn: () => getAdminAnnouncements(),
  })

  const handleReject = async () => {
    if (!selectedAnnouncement) return

    const result = await rejectAnnouncement(selectedAnnouncement.id, reason)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Annonce rejetée')
    setRejectDialogOpen(false)
    setReason('')
    refetch()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-sm text-destructive">
        Erreur lors du chargement des annonces. Veuillez recharger la page.
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: 'default',
      draft: 'secondary',
      cancelled: 'destructive',
      completed: 'secondary',
    }
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
  }

  const openRejectDialog = (announcement: any) => {
    setSelectedAnnouncement(announcement)
    setRejectDialogOpen(true)
  }

  const renderActionsMenu = (announcement: any) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <IconDotsVertical className="h-4 w-4" />
          <span className="sr-only">Actions annonce</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => openRejectDialog(announcement)}
        >
          <IconCircleX className="h-4 w-4" />
          Rejeter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modération des annonces"
        description="Liste et modération de toutes les annonces"
        breadcrumbs={[
          { label: 'Dashboard Admin', href: '/admin/dashboard' },
          { label: 'Annonces' },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Annonces ({announcements?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile — cards */}
          <div className="grid gap-3 md:hidden">
            {announcements?.map((announcement: any) => (
              <div
                key={announcement.id}
                className="rounded-lg border p-4 space-y-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {announcement.departure_city} →{' '}
                      {announcement.arrival_city}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(announcement.created_at), 'PP', {
                        locale: fr,
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {getStatusBadge(announcement.status)}
                    {renderActionsMenu(announcement)}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{announcement.price_per_kg} EUR/kg</span>
                  <span>{announcement.available_kg} kg dispo</span>
                </div>
              </div>
            ))}
            {(announcements?.length ?? 0) === 0 && (
              <EmptyState
                icon={<IconLuggage className="h-7 w-7" />}
                title="Aucune annonce à modérer"
                description="Les trajets publiés apparaîtront ici pour contrôle et suivi administratif."
                className="my-2"
              />
            )}
          </div>

          {/* Desktop — table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trajet</TableHead>
                  <TableHead>Prix/kg</TableHead>
                  <TableHead>Poids max</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements?.map((announcement: any) => (
                  <TableRow key={announcement.id}>
                    <TableCell>
                      {announcement.departure_city} →{' '}
                      {announcement.arrival_city}
                    </TableCell>
                    <TableCell>{announcement.price_per_kg} EUR/kg</TableCell>
                    <TableCell>{announcement.available_kg} kg</TableCell>
                    <TableCell>{getStatusBadge(announcement.status)}</TableCell>
                    <TableCell>
                      {format(new Date(announcement.created_at), 'PP', {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell>{renderActionsMenu(announcement)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Rejet */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter l'annonce</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir rejeter cette annonce ?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Raison du rejet</Label>
              <Textarea
                id="reject-reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Raison du rejet..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
