/**
 * Page de création d'annonce (multi-step)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createAnnouncementSchema,
  type CreateAnnouncementInput,
  COUNTRIES,
} from '@/lib/validations/announcement'
import { createAnnouncement } from '@/lib/actions/announcement'
import { searchCities } from '@/lib/utils/cities'
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Package,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/use-debounce'

const STEPS = [
  { id: 1, title: 'Trajet', icon: MapPin },
  { id: 2, title: 'Capacité', icon: Package },
  { id: 3, title: 'Publication', icon: CheckCircle2 },
] as const

export default function NewAnnouncementPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<CreateAnnouncementInput>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: {
      available_kg: 5,
      price_per_kg: 10,
    },
  })

  const departureCountry = watch('departure_country')
  const arrivalCountry = watch('arrival_country')
  const departureCity = watch('departure_city')
  const arrivalCity = watch('arrival_city')
  const departureDate = watch('departure_date')
  const availableKg = watch('available_kg')
  const pricePerKg = watch('price_per_kg')

  const debouncedDepartureCity = useDebounce(departureCity || '', 300)
  const debouncedArrivalCity = useDebounce(arrivalCity || '', 300)

  // Recherche autocomplete pour ville de départ
  useEffect(() => {
    if (debouncedDepartureCity && departureCountry) {
      searchCities(departureCountry, debouncedDepartureCity).then(
        setDepartureCitySuggestions
      )
    } else {
      setDepartureCitySuggestions([])
    }
  }, [debouncedDepartureCity, departureCountry])

  // Recherche autocomplete pour ville d'arrivée
  useEffect(() => {
    if (debouncedArrivalCity && arrivalCountry) {
      searchCities(arrivalCountry, debouncedArrivalCity).then(
        setArrivalCitySuggestions
      )
    } else {
      setArrivalCitySuggestions([])
    }
  }, [debouncedArrivalCity, arrivalCountry])

  const handleNext = async () => {
    let fieldsToValidate: (keyof CreateAnnouncementInput)[] = []

    if (currentStep === 1) {
      fieldsToValidate = [
        'departure_country',
        'departure_city',
        'departure_date',
        'arrival_country',
        'arrival_city',
        'arrival_date',
      ]
    } else if (currentStep === 2) {
      fieldsToValidate = ['available_kg', 'price_per_kg']
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const onSubmit = async (data: CreateAnnouncementInput) => {
    setIsSubmitting(true)
    try {
      const result = await createAnnouncement(data)

      if (result.error) {
        toast.error(result.error)
        // Si erreur KYC, rediriger vers la page KYC
        if (result.field === 'kyc') {
          router.push('/dashboard/reglages/kyc')
        }
        return
      }

      if (result.success && result.announcementId) {
        toast.success(result.message || 'Annonce créée avec succès')
        router.push(`/dashboard/annonces/${result.announcementId}`)
      }
    } catch (error) {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectCity = (
    city: string,
    type: 'departure' | 'arrival',
    setSuggestions: (cities: string[]) => void,
    setShow: (show: boolean) => void
  ) => {
    setValue(type === 'departure' ? 'departure_city' : 'arrival_city', city)
    setSuggestions([])
    setShow(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Créer une annonce"
        description="Publiez votre trajet et proposez votre espace disponible"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Annonces', href: '/dashboard/annonces' },
          { label: 'Nouvelle annonce' },
        ]}
      />

      {/* Indicateur d'étapes */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors ${
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : isCompleted
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-muted bg-muted text-muted-foreground'
                      }`}
                    >
                      <StepIcon className="h-6 w-6" />
                    </div>
                    <p
                      className={`mt-2 text-sm font-medium ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-4 ${
                        isCompleted ? 'bg-green-500' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Formulaire */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && 'Informations du trajet'}
              {currentStep === 2 && 'Capacité et tarification'}
              {currentStep === 3 && 'Récapitulatif'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Renseignez les détails de votre trajet'}
              {currentStep === 2 && "Définissez l'espace disponible et le prix"}
              {currentStep === 3 &&
                'Vérifiez les informations avant publication'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Étape 1 : Trajet */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Pays de départ */}
                <div className="space-y-2">
                  <Label htmlFor="departure_country">Pays de départ</Label>
                  <Select
                    onValueChange={value =>
                      setValue('departure_country', value as 'FR' | 'BJ')
                    }
                  >
                    <SelectTrigger id="departure_country">
                      <SelectValue placeholder="Sélectionnez un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>
                          {country === 'FR' ? 'France' : 'Bénin'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.departure_country && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.departure_country.message}
                    </p>
                  )}
                </div>

                {/* Ville de départ */}
                <div className="space-y-2">
                  <Label htmlFor="departure_city">Ville de départ</Label>
                  <div className="relative">
                    <Input
                      id="departure_city"
                      placeholder="Paris, Lyon, Cotonou..."
                      {...register('departure_city')}
                      onFocus={() => setShowDepartureSuggestions(true)}
                      aria-invalid={errors.departure_city ? 'true' : 'false'}
                    />
                    {showDepartureSuggestions &&
                      departureCitySuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg">
                          {departureCitySuggestions.map(city => (
                            <button
                              key={city}
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-accent"
                              onClick={() =>
                                selectCity(
                                  city,
                                  'departure',
                                  setDepartureCitySuggestions,
                                  setShowDepartureSuggestions
                                )
                              }
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                  {errors.departure_city && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.departure_city.message}
                    </p>
                  )}
                </div>

              {/* Date de départ */}
              <div className="space-y-2">
                <Label>Date de départ</Label>
                <div className="w-full overflow-x-auto">
                  <Calendar
                    mode="single"
                    selected={departureDate}
                    onSelect={date => {
                      setValue('departure_date', date || new Date())
                      if (date) {
                        // Ajuster la date d'arrivée si nécessaire
                        const currentArrival = watch('arrival_date')
                        if (!currentArrival || currentArrival <= date) {
                          const nextDay = new Date(date)
                          nextDay.setDate(nextDay.getDate() + 1)
                          setValue('arrival_date', nextDay)
                        }
                      }
                    }}
                    disabled={date => date < new Date()}
                    className="rounded-md border mx-auto"
                  />
                </div>
                  {departureDate && (
                    <p className="text-sm text-muted-foreground">
                      {format(departureDate, 'PP', { locale: fr })}
                    </p>
                  )}
                  {errors.departure_date && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.departure_date.message}
                    </p>
                  )}
                </div>

                {/* Pays d'arrivée */}
                <div className="space-y-2">
                  <Label htmlFor="arrival_country">Pays d'arrivée</Label>
                  <Select
                    onValueChange={value =>
                      setValue('arrival_country', value as 'FR' | 'BJ')
                    }
                  >
                    <SelectTrigger id="arrival_country">
                      <SelectValue placeholder="Sélectionnez un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>
                          {country === 'FR' ? 'France' : 'Bénin'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.arrival_country && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.arrival_country.message}
                    </p>
                  )}
                </div>

                {/* Ville d'arrivée */}
                <div className="space-y-2">
                  <Label htmlFor="arrival_city">Ville d'arrivée</Label>
                  <div className="relative">
                    <Input
                      id="arrival_city"
                      placeholder="Paris, Lyon, Cotonou..."
                      {...register('arrival_city')}
                      onFocus={() => setShowArrivalSuggestions(true)}
                      aria-invalid={errors.arrival_city ? 'true' : 'false'}
                    />
                    {showArrivalSuggestions &&
                      arrivalCitySuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg">
                          {arrivalCitySuggestions.map(city => (
                            <button
                              key={city}
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-accent"
                              onClick={() =>
                                selectCity(
                                  city,
                                  'arrival',
                                  setArrivalCitySuggestions,
                                  setShowArrivalSuggestions
                                )
                              }
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                  {errors.arrival_city && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.arrival_city.message}
                    </p>
                  )}
                </div>

                {/* Date d'arrivée */}
                <div className="space-y-2">
                  <Label>Date d'arrivée</Label>
                  <Calendar
                    mode="single"
                    selected={watch('arrival_date')}
                    onSelect={date =>
                      setValue('arrival_date', date || new Date())
                    }
                    disabled={date => {
                      if (!departureDate) return date < new Date()
                      const minDate = new Date(departureDate)
                      minDate.setDate(minDate.getDate() + 1)
                      return date < minDate
                    }}
                    className="rounded-md border"
                  />
                  {watch('arrival_date') && (
                    <p className="text-sm text-muted-foreground">
                      {format(watch('arrival_date')!, 'PP', { locale: fr })}
                    </p>
                  )}
                  {errors.arrival_date && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.arrival_date.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Étape 2 : Capacité */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Poids disponible */}
                <div className="space-y-2">
                  <Label htmlFor="available_kg">
                    Poids disponible : {availableKg} kg
                  </Label>
                  <Slider
                    id="available_kg"
                    min={1}
                    max={30}
                    step={1}
                    value={[availableKg]}
                    onValueChange={([value]) => setValue('available_kg', value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 kg</span>
                    <span>30 kg</span>
                  </div>
                  {errors.available_kg && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.available_kg.message}
                    </p>
                  )}
                </div>

                {/* Prix par kilo */}
                <div className="space-y-2">
                  <Label htmlFor="price_per_kg">
                    Prix par kilo : {pricePerKg} €
                  </Label>
                  <Input
                    id="price_per_kg"
                    type="number"
                    min={5}
                    max={100}
                    step={1}
                    {...register('price_per_kg', { valueAsNumber: true })}
                    aria-invalid={errors.price_per_kg ? 'true' : 'false'}
                  />
                  <p className="text-xs text-muted-foreground">
                    Entre 5 € et 100 € par kilo
                  </p>
                  {errors.price_per_kg && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.price_per_kg.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optionnel)</Label>
                  <Textarea
                    id="description"
                    placeholder="Ajoutez des détails sur votre trajet..."
                    rows={4}
                    {...register('description')}
                    aria-invalid={errors.description ? 'true' : 'false'}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum 500 caractères
                  </p>
                  {errors.description && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Étape 3 : Preview */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Trajet</h3>
                    <p className="text-sm text-muted-foreground">
                      {departureCity} (
                      {departureCountry === 'FR' ? 'France' : 'Bénin'}) →{' '}
                      {arrivalCity} (
                      {arrivalCountry === 'FR' ? 'France' : 'Bénin'})
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Départ :{' '}
                      {departureDate &&
                        format(departureDate, 'PP', { locale: fr })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Arrivée :{' '}
                      {watch('arrival_date') &&
                        format(watch('arrival_date')!, 'PP', { locale: fr })}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Capacité</h3>
                    <p className="text-sm text-muted-foreground">
                      Poids disponible : {availableKg} kg
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Prix : {pricePerKg} € / kg
                    </p>
                    <Badge className="mt-2">
                      Total max : {availableKg * pricePerKg} €
                    </Badge>
                  </div>

                  {watch('description') && (
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground">
                        {watch('description')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>

              {currentStep < 3 ? (
                <Button type="button" onClick={handleNext}>
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publication...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Publier l'annonce
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}




