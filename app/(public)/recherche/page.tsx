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
import { AnnouncementCard } from '@/components/features/announcements/AnnouncementCard'
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { COUNTRIES } from "@/lib/core/announcements/validations"
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({
    departureCountry: 'ALL',
    arrivalCountry: 'ALL',
    departureDate: null,
    minKg: 1,
    sortBy: 'date',
    page: 1,
  })

  const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined)

  // Query pour rechercher les annonces
  const {
    data: announcementsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['announcements', 'search', filters],
    queryFn: () => {
      // Convertir 'ALL' en null pour la recherche
      const searchFilters = {
        ...filters,
        departureCountry: filters.departureCountry === 'ALL' ? null : filters.departureCountry,
        arrivalCountry: filters.arrivalCountry === 'ALL' ? null : filters.arrivalCountry,
      }
      return searchAnnouncementsClient(searchFilters)
    },
  })

  // Query pour compter le total
  const { data: countData } = useQuery({
    queryKey: ['announcements', 'count', filters],
    queryFn: () => {
      // Convertir 'ALL' en null pour le comptage
      const searchFilters = {
        ...filters,
        departureCountry: filters.departureCountry === 'ALL' ? null : filters.departureCountry,
        arrivalCountry: filters.arrivalCountry === 'ALL' ? null : filters.arrivalCountry,
      }
      return countSearchAnnouncements(searchFilters)
    },
  })

  const announcements = announcementsData?.data || []
  const totalCount = countData?.count || 0
  const totalPages = Math.ceil(totalCount / 10)

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }))
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
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtres */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
              <CardDescription>Affinez votre recherche</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pays de départ */}
              <div className="space-y-2">
                <Label htmlFor="departure_country">Pays de départ</Label>
                <Select
                  value={filters.departureCountry || ''}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      departureCountry: value || null,
                    }))
                  }
                >
                  <SelectTrigger id="departure_country">
                    <SelectValue placeholder="Tous les pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les pays</SelectItem>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country === 'FR' ? 'France' : 'Bénin'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pays d'arrivée */}
              <div className="space-y-2">
                <Label htmlFor="arrival_country">Pays d'arrivée</Label>
                <Select
                  value={filters.arrivalCountry || ''}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      arrivalCountry: value || null,
                    }))
                  }
                >
                  <SelectTrigger id="arrival_country">
                    <SelectValue placeholder="Tous les pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les pays</SelectItem>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country === 'FR' ? 'France' : 'Bénin'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date de départ */}
              <div className="space-y-2">
                <Label>Date de départ (±3 jours)</Label>
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
                  className="rounded-md border"
                />
                {departureDate && (
                  <p className="text-xs text-muted-foreground">
                    {format(departureDate, 'PP', { locale: fr })}
                  </p>
                )}
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
                <Search className="mr-2 h-4 w-4" />
                Rechercher
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Résultats */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                    <ChevronLeft className="h-4 w-4" />
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
                    <ChevronRight className="h-4 w-4" />
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





