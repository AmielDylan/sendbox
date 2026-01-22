/**
 * Page "Mes colis" - Liste des réservations de l'utilisateur
 * OPTIMISÉE avec useAuthenticatedQuery pour résoudre les timeouts et pertes de données
 */

'use client'

import { useState, useEffect } from 'react'
import { useAuthenticatedQuery, queryWithAbort } from '@/hooks/use-authenticated-query'
import { QUERY_CONFIG } from '@/lib/shared/query/config'
import { createClient } from "@/lib/shared/db/client"
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  IconLoader2,
  IconPlus,
  IconPackage,
  IconMapPin,
  IconCalendar,
  IconCurrencyEuro,
  IconEye,
  IconAlertCircle,
  IconTrash,
} from '@tabler/icons-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getCountryName } from '@/lib/utils/countries'
import { DeleteBookingDialog } from '@/components/features/bookings/DeleteBookingDialog'

type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'paid'
  | 'deposited'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'

interface Booking {
  id: string
  status: BookingStatus
  kilos_requested: number
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
  const [activeTab, setActiveTab] = useState<BookingStatus | 'all'>('all')

  // Query OPTIMISÉE avec useAuthenticatedQuery
  // ✅ Pas de double-fetch de session
  // ✅ Timeout intelligent de 5s (au lieu de 12s)
  // ✅ Retry automatique avec backoff
  // ✅ Cache persistant (30s stale, 15min gc)
  const { data, isLoading, isError, error, refetch } = useAuthenticatedQuery<Booking[]>(
    ['user-bookings', activeTab] as unknown[],
    async (userId, signal) => {
      const supabase = createClient()

      // Construire la requête
      let query = supabase
        .from('bookings')
        .select(
          `
          id,
          status,
          kilos_requested,
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
        .or(`sender_id.eq.${userId},traveler_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      // Filtrer par statut
      if (activeTab !== 'all') {
        if (activeTab === 'accepted') {
          query = query.in('status', ['accepted', 'paid', 'deposited'])
        } else {
          query = query.eq('status', activeTab)
        }
      }

      // Exécuter avec timeout via AbortSignal
      return queryWithAbort<Booking[]>(query, signal)
    },
    {
      // Timeout de 5 secondes (au lieu de 12)
      timeout: 5000,

      // Configuration optimisée pour les listes
      staleTime: QUERY_CONFIG.LISTS.staleTime,
      gcTime: QUERY_CONFIG.LISTS.gcTime,
      refetchOnWindowFocus: false,
    }
  )

  const bookings = data || []
  const showCreateButton = bookings.length > 0

  // Rafraîchir les bookings en temps réel (insert/update/delete)
  useEffect(() => {
    const supabase = createClient()
    let isActive = true
    let channel: any = null

    const getChannelName = (userId: string) => {
      const suffix =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)
      return `bookings:colis:${userId}:${suffix}`
    }

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !isActive) return

      channel = supabase
        .channel(getChannelName(user.id))
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `sender_id=eq.${user.id}`,
          },
          () => {
            refetch()
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `traveler_id=eq.${user.id}`,
          },
          () => {
            refetch()
          }
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    return () => {
      isActive = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [refetch])

  const getStatusBadge = (status: BookingStatus) => {
    const variants: Record<BookingStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      accepted: 'default',
      paid: 'default',
      deposited: 'default',
      in_transit: 'default',
      delivered: 'default',
      cancelled: 'destructive',
    }

    const labels: Record<BookingStatus, string> = {
      pending: 'En attente',
      accepted: 'Accepté',
      paid: 'Payé',
      deposited: 'Déposé',
      in_transit: 'En transit',
      delivered: 'Livré',
      cancelled: 'Annulé',
    }

    return (
      <Badge variant={variants[status]} className="w-fit whitespace-nowrap">
        {labels[status]}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Mes colis"
          description="Gérez vos réservations et suivez vos colis"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <IconLoader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              Chargement de vos réservations...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Mes colis"
          description="Gérez vos réservations et suivez vos colis"
        />
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-3 flex-1">
                <div>
                  <p className="font-semibold text-destructive mb-1">
                    Erreur lors du chargement
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {error?.message || 'Une erreur est survenue lors du chargement de vos réservations.'}
                  </p>
                </div>
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  size="sm"
                >
                  Réessayer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mes colis"
        description="Gérez vos réservations et suivez vos colis"
        actions={
          showCreateButton ? (
            <Button asChild>
              <Link href="/dashboard/colis/new">
                <IconPlus className="mr-2 h-4 w-4" />
                Créer une réservation
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Dropdown sur mobile, Tabs sur tablet/desktop */}
      <div className="md:hidden">
        <div className="flex items-center gap-3">
          <label htmlFor="booking-status-filter" className="text-sm font-medium whitespace-nowrap">
            Statut:
          </label>
          <Select value={activeTab} onValueChange={(v) => setActiveTab(v as BookingStatus | 'all')}>
            <SelectTrigger id="booking-status-filter" className="w-full">
              <SelectValue placeholder="Sélectionner un statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="accepted">Confirmés</SelectItem>
              <SelectItem value="in_transit">En transit</SelectItem>
              <SelectItem value="delivered">Livrés</SelectItem>
              <SelectItem value="cancelled">Annulés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs sur tablet/desktop */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BookingStatus | 'all')} className="hidden md:block">
        <TabsList className="flex w-full flex-wrap justify-start gap-2 md:inline-flex md:w-auto md:flex-nowrap">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="accepted">Confirmés</TabsTrigger>
          <TabsTrigger value="in_transit">En transit</TabsTrigger>
          <TabsTrigger value="delivered">Livrés</TabsTrigger>
          <TabsTrigger value="cancelled">Annulés</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4 mt-6">
        {bookings.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="pt-12 pb-12">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                    <IconPackage className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display text-lg font-semibold">
                      Aucun colis trouvé
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      {activeTab === 'all'
                        ? 'Vous n\'avez pas encore de réservations.'
                        : `Vous n'avez pas de colis avec le statut "${activeTab}".`}
                    </p>
                  </div>
                  <Button asChild className="mt-2 shadow-warm hover:shadow-xl transition-all hover:-translate-y-0.5">
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
                  <Card key={booking.id} className="card-elevated hover:shadow-xl transition-all overflow-hidden">
                    <CardHeader className="p-4 sm:p-6 bg-muted/20">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between sm:block">
                            <CardTitle className="text-base sm:text-lg leading-tight">
                              {announcement
                                ? `${announcement.departure_city} → ${announcement.arrival_city}`
                                : 'Colis'}
                            </CardTitle>
                            {/* Badge visible only on mobile next to title to save space, hidden on sm */}
                            <div className="sm:hidden ml-2 shrink-0">
                              {getStatusBadge(booking.status)}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Créé le{' '}
                            {format(new Date(booking.created_at), 'PPP', {
                              locale: fr,
                            })}
                          </p>
                        </div>
                        {/* Badge visible only on sm */}
                        <div className="hidden sm:block shrink-0">
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-3">
                          {announcement && (
                            <>
                              <div className="flex items-start gap-2 text-sm">
                                <IconMapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <span className="leading-tight">
                                  {announcement.departure_city}, {getCountryName(announcement.departure_country)}
                                  <br className="sm:hidden" />
                                  <span className="hidden sm:inline"> → </span>
                                  <span className="sm:hidden block mt-1">↓</span>
                                  {announcement.arrival_city}, {getCountryName(announcement.arrival_country)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <IconCalendar className="h-4 w-4 text-muted-foreground shrink-0" />
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
                        <div className="space-y-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                          <div className="flex items-center justify-between sm:justify-start sm:gap-6">
                            <div className="flex items-center gap-2 text-sm">
                              <IconPackage className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.kilos_requested} kg</span>
                            </div>
                            {booking.total_price && (
                              <div className="flex items-center gap-2 text-sm">
                                <IconCurrencyEuro className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold text-base">
                                  {booking.total_price.toFixed(2)} €
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                        {booking.status === 'cancelled' && (
                          <DeleteBookingDialog
                            bookingId={booking.id}
                            redirectAfterDelete={false}
                            onDeleted={refetch}
                            trigger={
                              <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                                <IconTrash className="mr-2 h-4 w-4" />
                                Supprimer
                              </Button>
                            }
                          />
                        )}
                        <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
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
      </div>
    </div>
  )
}
