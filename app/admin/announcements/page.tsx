/**
 * Page modération annonces admin
 */

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/shared/db/client'
import { rejectAnnouncement } from '@/lib/core/admin/actions'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { IconLoader2, IconCircleX, IconLuggage, IconFilter } from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function AdminAnnouncementsPage() {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [filterSendbox, setFilterSendbox] = useState<'all' | 'sendbox' | 'sendbox_available'>('all')

  const supabase = createClient()

  const {
    data: announcements,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['adminAnnouncements', filterSendbox],
    queryFn: async () => {
      let query = supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filterSendbox === 'sendbox') {
        query = query.eq('is_sendbox', true)
      } else if (filterSendbox === 'sendbox_available') {
        query = query.eq('sendbox_available', true)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: 'default',
      draft: 'secondary',
      cancelled: 'destructive',
      completed: 'secondary',
    }
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Modération des annonces</h1>
        <p className="text-muted-foreground">
          Liste et modération de toutes les annonces
        </p>
      </div>

      {/* Filtres Sendbox */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filterSendbox === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterSendbox('all')}
        >
          <IconFilter className="h-3.5 w-3.5 mr-1" />
          Toutes
        </Button>
        <Button
          size="sm"
          variant={filterSendbox === 'sendbox' ? 'default' : 'outline'}
          onClick={() => setFilterSendbox('sendbox')}
        >
          <IconLuggage className="h-3.5 w-3.5 mr-1" />
          Valises Sendbox
        </Button>
        <Button
          size="sm"
          variant={filterSendbox === 'sendbox_available' ? 'default' : 'outline'}
          onClick={() => setFilterSendbox('sendbox_available')}
        >
          <IconLuggage className="h-3.5 w-3.5 mr-1" />
          Disponibles valise Sendbox
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Annonces ({announcements?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trajet</TableHead>
                <TableHead>Type</TableHead>
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
                    {announcement.departure_city} → {announcement.arrival_city}
                  </TableCell>
                  <TableCell>
                    {announcement.is_sendbox ? (
                      <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                        <IconLuggage className="h-3 w-3 mr-1" />
                        Sendbox
                      </Badge>
                    ) : announcement.sendbox_available ? (
                      <Badge variant="outline" className="text-[10px]">
                        <IconLuggage className="h-3 w-3 mr-1" />
                        Dispo valise
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        P2P
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{announcement.price_per_kg} EUR/kg</TableCell>
                  <TableCell>{announcement.available_kg} kg</TableCell>
                  <TableCell>{getStatusBadge(announcement.status)}</TableCell>
                  <TableCell>
                    {format(new Date(announcement.created_at), 'PP', {
                      locale: fr,
                    })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedAnnouncement(announcement)
                        setRejectDialogOpen(true)
                      }}
                    >
                      <IconCircleX className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
