/**
 * Page de recherche publique d'annonces
 */

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  searchAnnouncementsClient,
  countSearchAnnouncements,
  type SearchFilters,
} from "@/lib/shared/db/queries/announcements"
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { AnnouncementCard } from '@/components/features/announcements/AnnouncementCard'
import {
  IconLoader2,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconCalendar,
  IconSparkles,
  IconShieldCheck,
  IconClock,
  IconCurrencyEuro,
  IconPackage,
  IconMapPin,
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuth } from '@/hooks/use-auth'
import { getCountryName } from '@/lib/utils/countries'

const sortLabelMap = {
  date: 'Date proche',
  price: 'Prix croissant',
  rating: 'Note voyageur',
} as const

export default function SearchPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState<SearchFilters>({
    departureCountry: null,
    arrivalCountry: null,
    departureDate: null,
    minKg: 1,
    sortBy: 'date',
    page: 1,
  })
  const [hasSearched, setHasSearched] = useState(false)

  const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined)

  // Query pour rechercher les annonces
  const {
    data: announcementsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['announcements', 'search', filters],
    queryFn: () => searchAnnouncementsClient(filters),
    enabled: hasSearched,
  })

  // Query pour compter le total
  const { data: countData } = useQuery({
    queryKey: ['announcements', 'count', filters],
    queryFn: () => countSearchAnnouncements(filters),
    enabled: hasSearched,
  })

  const announcements = announcementsData?.data || []
  const totalCount = countData?.count || 0
  const totalPages = Math.ceil(totalCount / 10)

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }))
    setHasSearched(true)
  }

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeFilters = [
    filters.departureCountry
      ? `Départ : ${getCountryName(filters.departureCountry)}`
      : null,
    filters.arrivalCountry
      ? `Arrivée : ${getCountryName(filters.arrivalCountry)}`
      : null,
    departureDate
      ? `Date : ${format(departureDate, 'PP', { locale: fr })}`
      : null,
    filters.minKg && filters.minKg > 1 ? `Min : ${filters.minKg} kg` : null,
    filters.sortBy && filters.sortBy !== 'date'
      ? `Tri : ${sortLabelMap[filters.sortBy]}`
      : null,
  ].filter(Boolean) as string[]

  const resultsSummary = !hasSearched
    ? 'Utilisez les filtres pour lancer une recherche personnalisée.'
    : isLoading
      ? 'Recherche en cours...'
      : error
        ? 'Erreur lors de la recherche. Veuillez réessayer.'
        : announcements.length === 0
          ? 'Aucune annonce trouvée pour ces critères.'
          : `${totalCount} annonce${totalCount > 1 ? 's' : ''} disponible${totalCount > 1 ? 's' : ''}`

  return (
    <div className="bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="container-wide space-y-10 py-8 sm:py-12 lg:py-16">
        <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-background via-muted/30 to-primary/10 px-6 py-10 sm:px-10">
          <div className="absolute inset-0 bg-map-grid opacity-60" />
          <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
          <div className="relative z-10 space-y-8">
            <Badge className="w-fit gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-primary">
              <IconSparkles className="h-4 w-4" />
              Recherche intelligente
            </Badge>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <h1 className="font-display text-4xl text-balance sm:text-5xl lg:text-6xl">
                  Recherchez un trajet fiable pour votre colis
                </h1>
                <p className="text-lg text-muted-foreground sm:text-xl">
                  Filtrez par pays, date et poids pour trouver un voyageur vérifié entre la France et le Bénin.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {user ? (
                  <Button asChild size="lg" className="h-12 rounded-2xl">
                    <Link href="/dashboard/annonces/new">
                      <IconPackage className="mr-2 h-4 w-4" />
                      Créer une annonce
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="h-12 rounded-2xl">
                    <Link href="/register">
                      <IconPackage className="mr-2 h-4 w-4" />
                      Créer un compte
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" size="lg" className="h-12 rounded-2xl">
                  <Link href="/">Découvrir Sendbox</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="surface-glass rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <IconClock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">Réponse rapide</p>
                    <p className="text-sm text-muted-foreground">
                      Alertes en temps réel dès qu'une annonce correspond.
                    </p>
                  </div>
                </div>
              </div>
              <div className="surface-glass rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <IconShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">Voyageurs vérifiés</p>
                    <p className="text-sm text-muted-foreground">
                      Profils notés, identités vérifiées et support actif.
                    </p>
                  </div>
                </div>
              </div>
              <div className="surface-glass rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent">
                    <IconCurrencyEuro className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">Tarifs transparents</p>
                    <p className="text-sm text-muted-foreground">
                      Comparez les prix au kilo et économisez.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]">
          <aside className="space-y-4 lg:sticky lg:top-24">
            <Card className="card-elevated border-primary/10 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconSearch className="h-5 w-5 text-primary" />
                  Filtres
                </CardTitle>
                <CardDescription>Affinez votre recherche en quelques clics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="departure_country">Pays de départ</Label>
                  <Select
                    value={filters.departureCountry || undefined}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        departureCountry: value as 'FR' | 'BJ' | null,
                      }))
                    }
                  >
                    <SelectTrigger id="departure_country">
                      <SelectValue placeholder="Tous les pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="BJ">Bénin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrival_country">Pays d'arrivée</Label>
                  <Select
                    value={filters.arrivalCountry || undefined}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        arrivalCountry: value as 'FR' | 'BJ' | null,
                      }))
                    }
                  >
                    <SelectTrigger id="arrival_country">
                      <SelectValue placeholder="Tous les pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="BJ">Bénin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date de départ (±3 jours)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <IconCalendar className="mr-2 h-4 w-4" />
                        {departureDate ? format(departureDate, 'PP', { locale: fr }) : 'Sélectionner une date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" side="bottom" align="start">
                      <Calendar
                        mode="single"
                        selected={departureDate}
                        onSelect={(date) => {
                          setDepartureDate(date)
                          setFilters((prev) => ({
                            ...prev,
                            departureDate: date || null,
                          }))
                        }}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_kg">
                    Poids minimum : {filters.minKg || 1} kg
                  </Label>
                  <Slider
                    id="min_kg"
                    min={1}
                    max={30}
                    step={1}
                    value={[filters.minKg || 1]}
                    onValueChange={([value]) =>
                      setFilters((prev) => ({ ...prev, minKg: value }))
                    }
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sort_by">Trier par</Label>
                  <Select
                    value={filters.sortBy || 'date'}
                    onValueChange={(value: 'date' | 'price' | 'rating') =>
                      setFilters((prev) => ({ ...prev, sortBy: value }))
                    }
                  >
                    <SelectTrigger id="sort_by">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date proche</SelectItem>
                      <SelectItem value="price">Prix croissant</SelectItem>
                      <SelectItem value="rating">Note voyageur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSearch} className="h-12 w-full text-base">
                  <IconSearch className="mr-2 h-4 w-4" />
                  Rechercher
                </Button>
              </CardContent>
            </Card>

            <Card className="border-secondary/10 bg-gradient-to-br from-secondary/10 via-background to-background">
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <IconMapPin className="h-4 w-4 text-secondary" />
                  Conseils rapides
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-secondary" />
                    <span>Ajoutez une date pour améliorer le matching.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-secondary" />
                    <span>Augmentez le poids minimum pour filtrer les petits colis.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-secondary" />
                    <span>Comparez les prix au kilo avant de contacter.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-6">
            <div className="rounded-3xl border bg-card/70 p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">Annonces disponibles</h2>
                  <p className="text-sm text-muted-foreground">{resultsSummary}</p>
                </div>
                {hasSearched && activeFilters.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {activeFilters.map((item) => (
                      <Badge key={item} variant="secondary" className="rounded-full border border-border/70 bg-background/80">
                        {item}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {!hasSearched ? (
              <Card className="surface-glass rounded-2xl border-primary/10">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <IconSearch className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold">Lancez votre première recherche</p>
                    <p className="text-sm text-muted-foreground">
                      Utilisez les filtres pour découvrir les annonces disponibles.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : isLoading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="pt-6">
                  <p className="text-destructive">
                    Erreur lors de la recherche. Veuillez réessayer.
                  </p>
                </CardContent>
              </Card>
            ) : announcements.length === 0 ? (
              <Card className="surface-glass rounded-2xl border-primary/10">
                <CardContent className="py-10">
                  <p className="text-center text-muted-foreground">
                    Aucune annonce trouvée. Modifiez vos critères de recherche.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    showMatchScore={
                      !!(
                        filters.departureCountry ||
                        filters.arrivalCountry ||
                        filters.departureDate
                      )
                    }
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && announcements.length > 0 && (
              <div className="flex items-center justify-center gap-2 rounded-2xl border bg-card/70 px-4 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! - 1)}
                  disabled={filters.page === 1}
                >
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {filters.page} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! + 1)}
                  disabled={filters.page === totalPages}
                >
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
