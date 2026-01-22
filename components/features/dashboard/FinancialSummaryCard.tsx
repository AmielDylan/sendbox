'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/shared/db/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconTrendingUp, IconChevronDown, IconChevronUp, IconLoader2 } from '@tabler/icons-react'
import {
  calculateTravelerFinancials,
  calculateRequesterFinancials,
  type TravelerFinancials,
  type RequesterFinancials,
} from '@/lib/core/bookings/financial-calculations'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { Database } from '@/types/database.types'

type Booking = Database['public']['Tables']['bookings']['Row']

interface Props {
  userId: string
  role: 'traveler' | 'requester'
}

export function FinancialSummaryCard({ userId, role }: Props) {
  const [financials, setFinancials] = useState<TravelerFinancials | RequesterFinancials | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  const loadFinancials = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    const query =
      role === 'traveler'
        ? supabase.from('bookings').select('*').eq('traveler_id', userId)
        : supabase.from('bookings').select('*').eq('sender_id', userId)

    const { data, error } = await query

    if (!error && data) {
      const calculated =
        role === 'traveler'
          ? calculateTravelerFinancials(data as Booking[])
          : calculateRequesterFinancials(data as Booking[])

      setFinancials(calculated)
    }

    setIsLoading(false)
  }, [role, userId])

  useEffect(() => {
    loadFinancials()
  }, [loadFinancials])

  // Keep financials in sync without manual refresh (realtime)
  useEffect(() => {
    const supabase = createClient()
    let channel: any = null
    let isActive = true

    const getChannelName = (userId: string, roleLabel: string) => {
      const suffix =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)
      return `bookings:financials:${roleLabel}:${userId}:${suffix}`
    }

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !isActive) return

      const filter =
        role === 'traveler' ? `traveler_id=eq.${userId}` : `sender_id=eq.${userId}`

      channel = supabase
        .channel(getChannelName(userId, role))
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter,
          },
          () => {
            loadFinancials()
          }
        )
        .subscribe()
    }

    void setup()

    return () => {
      isActive = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [loadFinancials, role, userId])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!financials || financials.bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {role === 'traveler' ? 'Fonds disponibles' : 'Montants bloqués'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aucun colis pour le moment</p>
        </CardContent>
      </Card>
    )
  }

  const isTravelerFinancials = (f: any): f is TravelerFinancials => role === 'traveler'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <IconTrendingUp className="h-5 w-5" />
          {role === 'traveler' ? 'Fonds voyageur' : 'Fonds client'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isTravelerFinancials(financials) ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Disponible maintenant
                </p>
                <p className="text-3xl font-bold">
                  {financials.availableAmount.toFixed(2)} €
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Débloqué après confirmation de livraison.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  En attente de confirmation
                </p>
                <p className="text-2xl font-semibold">
                  {financials.pendingAmount.toFixed(2)} €
                </p>
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  {financials.inTransitAmount > 0 && (
                    <div>• {financials.inTransitAmount.toFixed(2)} € en transit</div>
                  )}
                  {financials.awaitingPickupAmount > 0 && (
                    <div>• {financials.awaitingPickupAmount.toFixed(2)} € en attente de dépôt</div>
                  )}
                  {financials.pendingAmount === 0 && <div>Aucun montant en attente.</div>}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Net bloqué chez Sendbox
                </p>
                <p className="text-3xl font-bold">
                  {financials.totalBlocked.toFixed(2)} €
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Montant destiné au voyageur, libéré après confirmation.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Net payé
                </p>
                <p className="text-2xl font-semibold">
                  {financials.totalPaid.toFixed(2)} €
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {financials.bookings.length} colis concernés (commission déjà retirée).
                </p>
              </div>
            </div>
          )}

          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
              Voir le détail ({financials.bookings.length})
              {isOpen ? (
                <IconChevronUp className="h-4 w-4" />
              ) : (
                <IconChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-3">
              {financials.bookings.map((booking) => (
                <div key={booking.bookingId} className="rounded border p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {booking.trackingNumber || `#${booking.bookingId.slice(0, 8)}`}
                    </span>
                    <span className="text-sm font-bold">
                      {role === 'traveler'
                        ? booking.netAmount.toFixed(2)
                        : booking.netAmount.toFixed(2)}{' '}
                      €
                    </span>
                  </div>
                  {role === 'traveler' && (
                    <div className="text-[10px] text-muted-foreground">
                      {booking.deliveryConfirmedAt ? 'Confirmé' : 'En attente de confirmation'}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Transport</span>
                      <span>{booking.transportPrice.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commission</span>
                      <span>-{booking.commission.toFixed(2)} €</span>
                    </div>
                    {booking.protection > 0 && (
                      <div className="flex justify-between">
                        <span>Protection du colis</span>
                        <span>{booking.protection.toFixed(2)} €</span>
                      </div>
                    )}
                    {role === 'traveler' && (
                      <div className="flex justify-between font-medium text-foreground pt-1 border-t">
                        <span>Vous recevrez</span>
                        <span>{booking.netAmount.toFixed(2)} €</span>
                      </div>
                    )}
                    {role === 'requester' && (
                      <div className="flex justify-between font-medium text-foreground pt-1 border-t">
                        <span>Net voyageur</span>
                        <span>{booking.netAmount.toFixed(2)} €</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  )
}
