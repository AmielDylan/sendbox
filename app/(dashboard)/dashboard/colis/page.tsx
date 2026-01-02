/**
 * Page "Mes colis" - Liste des réservations de l'utilisateur
 */

'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from "@/lib/shared/db/client"
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  IconLoader2,
  IconPlus,
  IconPackage,
  IconMapPin,
  IconCalendar,
  IconCurrencyEuro,
  IconEye,
  IconArrowRight,
} from '@tabler/icons-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'

interface Booking {
  id: string
  status: BookingStatus
  kilos_requested: number
  weight_kg?: number  // Ancienne colonne (fallback)
  total_price: number | null
  created_at: string
  announcements: {
    departure_city: string
    arrival_city: string
    departure_country: string
    arrival_country: string
    departure_date: string
  } | null
}

export default function MyBookingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<BookingStatus | 'all'>('all')

  // Query pour récupérer les bookings
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['user-bookings', user?.id, activeTab],
    queryFn: async () => {
      if (!user?.id) return { data: null, error: null }

      const supabase = createClient()
      let query = supabase
        .from('bookings')
        .select(
          `
          id,
          status,
          kilos_requested,
          weight_kg,
          total_price,
          created_at,
          announcements:announcement_id (
            departure_city,
            arrival_city,
            departure_country,
            arrival_country,
            departure_date
          )
        `
        )
        .or(`sender_id.eq.${user.id},traveler_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab)
      }

      const { data: bookings, error } = await query

      if (error) {
        console.error('Get bookings error:', error)
        return { data: null, error }
      }

      return { data: bookings as any as Booking[], error: null }
    },
    enabled: !!user?.id,
  })

  const bookings = data?.data || []

  const getStatusBadge = (status: BookingStatus) => {
    const variants: Record<BookingStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      accepted: 'default',
      in_transit: 'default',
      delivered: 'default',
      cancelled: 'destructive',
    }

    const labels: Record<BookingStatus, string> = {
      pending: 'En attente',
      accepted: 'Confirmé',
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
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes colis"
        description="Gérez vos réservations et suivez vos colis"
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BookingStatus | 'all')}>
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="accepted">Confirmés</TabsTrigger>
          <TabsTrigger value="in_transit">En transit</TabsTrigger>
          <TabsTrigger value="delivered">Livrés</TabsTrigger>
          <TabsTrigger value="cancelled">Annulés</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <IconPackage className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                      <IconPlus className="mr-2 h-4 w-4" />
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
                              ? `${announcement.departure_city} → ${announcement.arrival_city}`
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
                                <IconMapPin className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {announcement.departure_city},{' '}
                                  {announcement.departure_country}
                                </span>
                                <IconArrowRight className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {announcement.arrival_city},{' '}
                                  {announcement.arrival_country}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <IconCalendar className="h-4 w-4 text-muted-foreground" />
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
                            <IconPackage className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.kilos_requested || booking.weight_kg || 0} kg</span>
                          </div>
                          {booking.total_price && (
                            <div className="flex items-center gap-2 text-sm">
                              <IconCurrencyEuro className="h-4 w-4 text-muted-foreground" />
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
                            <IconEye className="mr-2 h-4 w-4" />
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


