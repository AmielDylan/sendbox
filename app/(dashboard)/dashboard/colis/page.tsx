/**
 * Page "Mes colis" - Liste des réservations de l'utilisateur
 */

'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Loader2,
  Plus,
  Package,
  MapPin,
  Calendar,
  Euro,
  Eye,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'

interface Booking {
  id: string
  status: BookingStatus
  weight_kg: number
  total_price: number | null
  created_at: string
  announcements: {
    origin_city: string
    destination_city: string
    origin_country: string
    destination_country: string
    departure_date: string
  } | null
}

export default function MyBookingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<BookingStatus | 'all'>('all')
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

  // Query pour récupérer les bookings
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['user-bookings', userId, activeTab],
    queryFn: async () => {
      if (!userId) return { data: null, error: null }

      const supabase = createClient()
      let query = supabase
        .from('bookings')
        .select(
          `
          id,
          status,
          weight_kg,
          total_price,
          created_at,
          announcements:announcement_id (
            origin_city,
            destination_city,
            origin_country,
            destination_country,
            departure_date
          )
        `
        )
        .or(`sender_id.eq.${userId},traveler_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab)
      }

      const { data: bookings, error } = await query

      if (error) {
        console.error('Get bookings error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        console.error('User ID:', userId)
        return { data: null, error }
      }

      return { data: bookings as Booking[], error: null }
    },
    enabled: !!userId,
  })

  const bookings = data?.data || []

  const getStatusBadge = (status: BookingStatus) => {
    const variants: Record<BookingStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      confirmed: 'default',
      in_transit: 'default',
      delivered: 'default',
      cancelled: 'destructive',
    }

    const labels: Record<BookingStatus, string> = {
      pending: 'En attente',
      confirmed: 'Confirmé',
      in_transit: 'En transit',
      delivered: 'Livré',
      cancelled: 'Annulé',
    }

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes colis"
        description="Gérez vos réservations et suivez vos colis"
        actions={
          <Button asChild>
            <Link href="/dashboard/colis/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle réservation
            </Link>
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BookingStatus | 'all')}>
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmés</TabsTrigger>
          <TabsTrigger value="in_transit">En transit</TabsTrigger>
          <TabsTrigger value="delivered">Livrés</TabsTrigger>
          <TabsTrigger value="cancelled">Annulés</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Aucun colis trouvé
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'all'
                      ? 'Vous n\'avez pas encore de réservations.'
                      : `Vous n'avez pas de colis avec le statut "${activeTab}".`}
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/colis/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Créer une réservation
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {bookings.map((booking) => {
                const announcement = booking.announcements

                return (
                  <Card key={booking.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {announcement
                              ? `${announcement.origin_city} → ${announcement.destination_city}`
                              : 'Colis'}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Créé le{' '}
                            {format(new Date(booking.created_at), 'PPP', {
                              locale: fr,
                            })}
                          </p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          {announcement && (
                            <>
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {announcement.origin_city},{' '}
                                  {announcement.origin_country}
                                </span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {announcement.destination_city},{' '}
                                  {announcement.destination_country}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  Départ:{' '}
                                  {format(
                                    new Date(announcement.departure_date),
                                    'PPP',
                                    { locale: fr }
                                  )}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.weight_kg} kg</span>
                          </div>
                          {booking.total_price && (
                            <div className="flex items-center gap-2 text-sm">
                              <Euro className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {booking.total_price.toFixed(2)} €
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/colis/${booking.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir les détails
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}


