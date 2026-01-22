/**
 * Page de recherche publique d'annonces
 */

'use client'

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
  IconMapPin,
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getCountryName } from '@/lib/utils/countries'

const sortLabelMap = {
  date: 'Date proche',
  price: 'Prix croissant',
  rating: 'Note voyageur',
} as const

export default function SearchPage() {
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
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-8 sm:px-16 lg:px-24 space-y-8 py-10 sm:py-12">
        {/* Simplified Header Section */}
        <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-background via-muted/30 to-primary/5 px-6 py-8 sm:px-10">
          <div className="absolute inset-0 bg-map-grid opacity-[0.03]" />
          <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10 space-y-4">
            <Badge variant="outline" className="w-fit gap-2 rounded-md px-3 py-1 text-xs border-primary/20 text-primary bg-primary/5">
              <IconSparkles className="h-3.5 w-3.5" />
              Recherche intelligente
            </Badge>

            <div className="max-w-3xl space-y-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight leading-tight">
                Rechercher un trajet
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base max-w-xl leading-relaxed">
                Trouvez un voyageur vérifié entre la France et le Bénin pour transporter votre colis.
              </p>
            </div>
            {/* Cards and Buttons removed as requested */}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6 lg:sticky lg:top-24 h-fit">
            <Card className="rounded-xl border-border/60 shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <IconSearch className="h-4 w-4 text-primary" />
                  Filtres
                </CardTitle>
                {/* Removed description for cleaner look */}
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="departure_country" className="text-xs font-medium">Pays de départ</Label>
                  <Select
                    value={filters.departureCountry || undefined}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        departureCountry: value as 'FR' | 'BJ' | null,
                      }))
                    }
                  >
                    <SelectTrigger id="departure_country" className="h-9 text-sm">
                      <SelectValue placeholder="Tous les pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="BJ">Bénin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrival_country" className="text-xs font-medium">Pays d'arrivée</Label>
                  <Select
                    value={filters.arrivalCountry || undefined}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        arrivalCountry: value as 'FR' | 'BJ' | null,
                      }))
                    }
                  >
                    <SelectTrigger id="arrival_country" className="h-9 text-sm">
                      <SelectValue placeholder="Tous les pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="BJ">Bénin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Date de départ (±3 jours)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-9 text-sm"
                      >
                        <IconCalendar className="mr-2 h-3.5 w-3.5" />
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

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="min_kg" className="text-xs font-medium">Poids min.</Label>
                    <span className="text-xs font-medium text-muted-foreground">{filters.minKg || 1} kg</span>
                  </div>
                  <Slider
                    id="min_kg"
                    min={1}
                    max={30}
                    step={1}
                    value={[filters.minKg || 1]}
                    onValueChange={([value]) =>
                      setFilters((prev) => ({ ...prev, minKg: value }))
                    }
                    className="w-full py-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sort_by" className="text-xs font-medium">Trier par</Label>
                  <Select
                    value={filters.sortBy || 'date'}
                    onValueChange={(value: 'date' | 'price' | 'rating') =>
                      setFilters((prev) => ({ ...prev, sortBy: value }))
                    }
                  >
                    <SelectTrigger id="sort_by" className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date proche</SelectItem>
                      <SelectItem value="price">Prix croissant</SelectItem>
                      <SelectItem value="rating">Note voyageur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSearch} className="h-10 w-full text-sm font-medium rounded-md tracking-tight">
                  <IconSearch className="mr-2 h-4 w-4" />
                  Rechercher
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-secondary/10 bg-secondary/5 shadow-none">
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <IconMapPin className="h-4 w-4 text-secondary" />
                  Conseils rapides
                </div>
                <div className="space-y-2.5 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary flex-shrink-0" />
                    <span>Ajoutez une date pour améliorer le matching.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary flex-shrink-0" />
                    <span>Augmentez le poids minimum pour filtrer les petits colis.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary flex-shrink-0" />
                    <span>Comparez les prix au kilo.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-6">
            <div className="rounded-xl border bg-card/40 p-5 px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold tracking-tight">Annonces disponibles</h2>
                  <p className="text-sm text-muted-foreground">{resultsSummary}</p>
                </div>
                {hasSearched && activeFilters.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {activeFilters.map((item) => (
                      <Badge key={item} variant="secondary" className="rounded-md border border-border/50 bg-background/50 px-2 py-0.5 text-xs font-normal text-muted-foreground">
                        {item}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {!hasSearched ? (
              <Card className="rounded-xl border-dashed border-2 border-muted shadow-none bg-muted/5">
                <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground/70">
                    <IconSearch className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-medium">Lancez votre première recherche</p>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Utilisez les filtres à gauche pour découvrir les annonces disponibles.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : isLoading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <Card className="border-destructive/30 bg-destructive/5 shadow-none rounded-xl">
                <CardContent className="pt-6">
                  <p className="text-destructive text-sm text-center">
                    Erreur lors de la recherche. Veuillez réessayer.
                  </p>
                </CardContent>
              </Card>
            ) : announcements.length === 0 ? (
              <Card className="rounded-xl border-dashed border-2 border-muted shadow-none bg-muted/5">
                <CardContent className="py-16">
                  <p className="text-center text-muted-foreground text-sm">
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
              <div className="flex items-center justify-center gap-2 rounded-xl border bg-card/40 px-4 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! - 1)}
                  disabled={filters.page === 1}
                  className="h-8 w-8 p-0"
                >
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground font-medium">
                  Page {filters.page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! + 1)}
                  disabled={filters.page === totalPages}
                  className="h-8 w-8 p-0"
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
