/**
 * Page vitrine des disponibilités Sendbox
 * Affiche les annonces is_sendbox=true avec capacité disponible
 */

import Link from 'next/link'
import { createClient } from '@/lib/shared/db/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  IconLuggage,
  IconShieldCheck,
  IconMapPin,
  IconPackage,
  IconCalendar,
  IconArrowNarrowRight,
  IconArrowRight,
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const revalidate = 60

async function getSendboxDepartures() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_sendbox', true)
    .eq('status', 'active')
    .gte('departure_date', today)
    .order('departure_date', { ascending: true })
    .limit(20)

  if (error) {
    console.error('getSendboxDepartures error:', error)
    return []
  }

  return data || []
}

export default async function SendboxPage() {
  const departures = await getSendboxDepartures()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b bg-primary/5 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-8 max-w-5xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <IconLuggage className="h-4 w-4 text-primary" stroke={1.5} />
            </div>
            <Badge
              variant="outline"
              className="text-xs uppercase tracking-widest font-semibold px-3 py-1 border-primary/30 text-primary"
            >
              Service Sendbox
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Envoi Sendbox — Prochains départs
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            Sendbox vérifie et scelle vos colis dans des valises dédiées. Un
            voyageur les dépose en agence partenaire à destination.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <IconShieldCheck className="h-4 w-4 text-primary" stroke={1.5} />
              Contenu vérifié par Sendbox
            </span>
            <span className="flex items-center gap-1.5">
              <IconMapPin className="h-4 w-4 text-primary" stroke={1.5} />
              Dépôt en agence partenaire
            </span>
            <span className="flex items-center gap-1.5">
              <IconPackage className="h-4 w-4 text-primary" stroke={1.5} />
              Suivi QR code inclus
            </span>
          </div>
        </div>
      </section>

      {/* Departures list */}
      <section className="py-10 sm:py-14">
        <div className="container mx-auto px-4 sm:px-8 max-w-5xl">
          {departures.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <IconLuggage
                  className="h-8 w-8 text-muted-foreground"
                  stroke={1.5}
                />
              </div>
              <h2 className="text-xl font-bold">Aucun départ prévu</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Il n'y a pas encore de départ Sendbox disponible. Revenez
                prochainement ou contactez-nous pour planifier un envoi.
              </p>
              <Button asChild variant="outline">
                <Link href="/recherche">Voir les voyageurs indépendants</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {departures.length} départ{departures.length > 1 ? 's' : ''}{' '}
                disponible{departures.length > 1 ? 's' : ''}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {departures.map((dep: any) => {
                  const availableKg = (dep.available_kg ?? 0) - (dep.reserved_weight ?? 0)
                  return (
                    <Link key={dep.id} href={`/annonces/${dep.id}`}>
                      <Card className="h-full hover:border-primary/40 hover:bg-muted/20 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/60 group-hover:bg-primary transition-colors" />
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <IconLuggage className="h-3.5 w-3.5 text-primary" stroke={1.5} />
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                                  Valise Sendbox
                                </span>
                              </div>
                              <h3 className="font-bold text-xl group-hover:text-primary transition-colors flex items-center gap-2">
                                {dep.departure_city}
                                <IconArrowNarrowRight
                                  className="h-5 w-5 text-muted-foreground/50"
                                  stroke={1}
                                />
                                {dep.arrival_city}
                              </h3>
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary border-0 shrink-0"
                            >
                              {availableKg} kg dispo
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <IconCalendar className="h-4 w-4" stroke={1.5} />
                            <span>
                              Départ le{' '}
                              {format(
                                new Date(dep.departure_date),
                                'd MMMM yyyy',
                                { locale: fr }
                              )}
                            </span>
                          </div>

                          {dep.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {dep.description}
                            </p>
                          )}
                        </CardContent>
                        <CardFooter className="px-5 pb-5 pt-0">
                          <div className="flex items-center gap-2 text-sm text-primary font-medium group-hover:translate-x-1 transition-transform">
                            Réserver un espace
                            <IconArrowRight className="h-4 w-4" />
                          </div>
                        </CardFooter>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* P2P fallback */}
      <section className="border-t py-10">
        <div className="container mx-auto px-4 sm:px-8 max-w-5xl text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Votre date ne correspond pas à nos prochains départs ?
          </p>
          <Button asChild variant="outline">
            <Link href="/recherche">
              <IconMapPin className="h-4 w-4" />
              Trouver un voyageur indépendant
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
