/**
 * Page d'édition d'annonce
 */

'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import {
  createAnnouncementSchema,
  type CreateAnnouncementInput,
  COUNTRIES,
} from "@/lib/core/announcements/validations"
import { updateAnnouncement } from "@/lib/core/announcements/management"
import { searchCities } from "@/lib/shared/utils/cities"
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { toast } from 'sonner'
import {
  IconLoader2,
  IconMapPin,
  IconPackage,
  IconCurrencyEuro,
  IconCalendar,
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/use-debounce'
import { createClient } from "@/lib/shared/db/client"

export default function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [departureCitySuggestions, setDepartureCitySuggestions] = useState<
    string[]
  >([])
  const [arrivalCitySuggestions, setArrivalCitySuggestions] = useState<
    string[]
  >([])
  const [showDepartureSuggestions, setShowDepartureSuggestions] =
    useState(false)
  const [showArrivalSuggestions, setShowArrivalSuggestions] = useState(false)
  const [departureCityTyped, setDepartureCityTyped] = useState(false)
  const [arrivalCityTyped, setArrivalCityTyped] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateAnnouncementInput>({
    resolver: zodResolver(createAnnouncementSchema),
  })

  const departureCountry = watch('departure_country') as 'FR' | 'BJ' | undefined
  const arrivalCountry = watch('arrival_country') as 'FR' | 'BJ' | undefined
  const departureCity = watch('departure_city')
  const arrivalCity = watch('arrival_city')
  const departureDate = watch('departure_date')
  const availableKg = watch('available_kg')
  const pricePerKg = watch('price_per_kg')

  const debouncedDepartureCity = useDebounce(departureCity || '', 300)
  const debouncedArrivalCity = useDebounce(arrivalCity || '', 300)

  // Charger l'annonce existante
  useEffect(() => {
    const loadAnnouncement = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        toast.error('Annonce introuvable')
        router.push('/dashboard/annonces')
        return
      }

      // Pré-remplir le formulaire
      setValue('departure_country', data.departure_country as 'FR' | 'BJ')
      setValue('departure_city', data.departure_city)
      setValue('arrival_country', data.arrival_country as 'FR' | 'BJ')
      setValue('arrival_city', data.arrival_city)

      // Convertir les dates ISO en dates locales
      // Si la date est au format YYYY-MM-DD, on la parse directement
      // Si elle contient l'heure (YYYY-MM-DDTHH:MM:SS), on extrait juste la date
      const parseDateFromDB = (dateString: string) => {
        // Extraire juste la partie date (YYYY-MM-DD)
        const dateOnly = dateString.split('T')[0]
        const [year, month, day] = dateOnly.split('-').map(Number)
        // Créer une date locale à minuit
        return new Date(year, month - 1, day)
      }

      setValue('departure_date', parseDateFromDB(data.departure_date))
      if (data.arrival_date) {
        setValue('arrival_date', parseDateFromDB(data.arrival_date))
      }

      setValue('available_kg', data.available_kg || 0)
      setValue('price_per_kg', data.price_per_kg)
      setValue('description', data.description || '')

      setIsLoading(false)
    }

    loadAnnouncement()
  }, [id, router, setValue])

  // Recherche autocomplete pour ville de départ
  useEffect(() => {
    if (debouncedDepartureCity && debouncedDepartureCity.length >= 2 && departureCountry && departureCityTyped) {
      searchCities(departureCountry, debouncedDepartureCity).then((cities) => {
        setDepartureCitySuggestions(cities)
        setShowDepartureSuggestions(true)
      })
    } else {
      setDepartureCitySuggestions([])
      setShowDepartureSuggestions(false)
    }
  }, [debouncedDepartureCity, departureCountry, departureCityTyped])

  // Recherche autocomplete pour ville d'arrivée
  useEffect(() => {
    if (debouncedArrivalCity && debouncedArrivalCity.length >= 2 && arrivalCountry && arrivalCityTyped) {
      searchCities(arrivalCountry, debouncedArrivalCity).then((cities) => {
        setArrivalCitySuggestions(cities)
        setShowArrivalSuggestions(true)
      })
    } else {
      setArrivalCitySuggestions([])
      setShowArrivalSuggestions(false)
    }
  }, [debouncedArrivalCity, arrivalCountry, arrivalCityTyped])

  const onSubmit = async (data: CreateAnnouncementInput) => {
    setIsSubmitting(true)

    try {
      const result = await updateAnnouncement(id, data)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success(result.message)

        // Invalider les queries pour forcer le rafraîchissement
        queryClient.invalidateQueries({ queryKey: ['user-announcements'] })

        router.push('/dashboard/annonces')
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
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
        title="Modifier l'annonce"
        description="Mettez à jour les informations de votre trajet"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Annonces', href: '/dashboard/annonces' },
          { label: 'Modifier' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Trajet */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconMapPin className="h-5 w-5" />
              Trajet
            </CardTitle>
            <CardDescription>
              Modifiez les villes de départ et d'arrivée
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Départ */}
              <div className="space-y-2">
                <Label htmlFor="departure_country">Pays de départ</Label>
                <Select
                  value={departureCountry}
                  onValueChange={(value: 'FR' | 'BJ') =>
                    setValue('departure_country', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country === 'FR' ? 'France' : 'Bénin'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departure_country && (
                  <p className="text-sm text-destructive">
                    {errors.departure_country.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="departure_city">Ville de départ</Label>
                <Input
                  {...register('departure_city')}
                  placeholder="Paris, Cotonou..."
                  onFocus={() => setShowDepartureSuggestions(departureCityTyped && departureCitySuggestions.length > 0)}
                  onChange={(e) => {
                    register('departure_city').onChange(e)
                    setDepartureCityTyped(true)
                  }}
                />
                {errors.departure_city && (
                  <p className="text-sm text-destructive">
                    {errors.departure_city.message}
                  </p>
                )}
                {showDepartureSuggestions && departureCitySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {departureCitySuggestions.map((city, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-accent"
                        onClick={() => {
                          setValue('departure_city', city)
                          setShowDepartureSuggestions(false)
                        }}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Arrivée */}
              <div className="space-y-2">
                <Label htmlFor="arrival_country">Pays d'arrivée</Label>
                <Select
                  value={arrivalCountry}
                  onValueChange={(value: 'FR' | 'BJ') =>
                    setValue('arrival_country', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country === 'FR' ? 'France' : 'Bénin'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.arrival_country && (
                  <p className="text-sm text-destructive">
                    {errors.arrival_country.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="arrival_city">Ville d'arrivée</Label>
                <Input
                  {...register('arrival_city')}
                  placeholder="Paris, Cotonou..."
                  onFocus={() => setShowArrivalSuggestions(arrivalCityTyped && arrivalCitySuggestions.length > 0)}
                  onChange={(e) => {
                    register('arrival_city').onChange(e)
                    setArrivalCityTyped(true)
                  }}
                />
                {errors.arrival_city && (
                  <p className="text-sm text-destructive">
                    {errors.arrival_city.message}
                  </p>
                )}
                {showArrivalSuggestions && arrivalCitySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {arrivalCitySuggestions.map((city, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-accent"
                        onClick={() => {
                          setValue('arrival_city', city)
                          setShowArrivalSuggestions(false)
                        }}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date de départ */}
            <div className="space-y-2">
              <Label>Date de départ</Label>
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
                      setValue('departure_date', date || new Date())
                      // Ajuster la date d'arrivée si elle devient invalide
                      const currentArrival = watch('arrival_date')
                      if (!currentArrival || currentArrival <= date!) {
                        const nextDay = new Date(date!)
                        nextDay.setDate(nextDay.getDate() + 1)
                        setValue('arrival_date', nextDay)
                      }
                    }}
                    disabled={date => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              {errors.departure_date && (
                <p className="text-sm text-destructive">
                  {errors.departure_date.message}
                </p>
              )}
            </div>

            {/* Date d'arrivée */}
            <div className="space-y-2">
              <Label>Date d'arrivée</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <IconCalendar className="mr-2 h-4 w-4" />
                    {watch('arrival_date') ? format(watch('arrival_date')!, 'PP', { locale: fr }) : 'Sélectionner une date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" side="bottom" align="start">
                  <Calendar
                    mode="single"
                    selected={watch('arrival_date')}
                    onSelect={date => setValue('arrival_date', date || new Date())}
                    disabled={date => {
                      if (!departureDate) return date < new Date()
                      const minDate = new Date(departureDate)
                      minDate.setDate(minDate.getDate() + 1)
                      return date < minDate
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors.arrival_date && (
                <p className="text-sm text-destructive">
                  {errors.arrival_date.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Capacité et Prix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconPackage className="h-5 w-5" />
              Capacité et Prix
            </CardTitle>
            <CardDescription>
              Ajustez la capacité et le tarif
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Capacité disponible */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="available_kg">Capacité disponible</Label>
                <span className="text-2xl font-bold">{availableKg} kg</span>
              </div>
              <Slider
                value={[availableKg || 5]}
                onValueChange={(value) => setValue('available_kg', value[0])}
                max={30}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Maximum 30 kg par trajet
              </p>
              {errors.available_kg && (
                <p className="text-sm text-destructive">
                  {errors.available_kg.message}
                </p>
              )}
            </div>

            {/* Prix par kg */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="price_per_kg" className="flex items-center gap-2">
                  <IconCurrencyEuro className="h-4 w-4" />
                  Prix par kilogramme
                </Label>
                <span className="text-2xl font-bold">{pricePerKg} €/kg</span>
              </div>
              <Slider
                value={[pricePerKg || 10]}
                onValueChange={(value) => setValue('price_per_kg', value[0])}
                max={50}
                min={5}
                step={1}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>5 €/kg (minimum)</span>
                <span>50 €/kg (maximum)</span>
              </div>
              {errors.price_per_kg && (
                <p className="text-sm text-destructive">
                  {errors.price_per_kg.message}
                </p>
              )}
              {availableKg && pricePerKg && (
                <div className="rounded-lg border bg-muted p-4">
                  <p className="text-sm font-medium">
                    Revenu potentiel : {(availableKg * pricePerKg).toFixed(2)} €
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Si vous transportez toute la capacité disponible
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description (optionnel)</CardTitle>
            <CardDescription>
              Ajoutez des détails sur votre trajet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register('description')}
              placeholder="Ex: Je peux transporter des documents, petits colis légers, vêtements..."
              rows={4}
              className="resize-none"
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-2">
                {errors.description.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/annonces')}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Mise à jour...
              </>
            ) : (
              'Mettre à jour'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

