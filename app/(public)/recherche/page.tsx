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
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { IconLoader2, IconSearch, IconChevronLeft, IconChevronRight, IconCalendar } from '@tabler/icons-react'
import { COUNTRIES } from "@/lib/core/announcements/validations"
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuth } from '@/hooks/use-auth'

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rechercher une annonce"
        description="Trouvez le trajet idéal pour votre colis"
        actions={user ? (
          <Button asChild>
            <a href="/dashboard/annonces/new">
              <IconSearch className="mr-2 h-4 w-4" />
              Créer une annonce
            </a>
          </Button>
        ) : null}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtres */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
              <CardDescription>Affinez votre recherche</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pays de départ */}
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

              {/* Pays d'arrivée */}
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

              {/* Date de départ */}
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

              {/* Poids minimum */}
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

              {/* Tri */}
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
                    <SelectItem value="rating">Rating voyageur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSearch} className="w-full">
                <IconSearch className="mr-2 h-4 w-4" />
                Rechercher
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Résultats */}
        <div className="lg:col-span-3">
          {!hasSearched ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Utilisez les filtres pour rechercher une annonce
                </p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-destructive">
                  Erreur lors de la recherche. Veuillez réessayer.
                </p>
              </CardContent>
            </Card>
          ) : announcements.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Aucune annonce trouvée. Modifiez vos critères de recherche.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {totalCount} annonce{totalCount > 1 ? 's' : ''} trouvée
                  {totalCount > 1 ? 's' : ''}
                </p>
              </div>

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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}





