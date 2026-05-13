/**
 * Page de création d'annonce (multi-step)
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import {
  createAnnouncementSchema,
  type CreateAnnouncementInput,
  DEPARTURE_COUNTRY,
  ARRIVAL_COUNTRY,
} from '@/lib/core/announcements/validations'
import { createAnnouncement } from '@/lib/core/announcements/actions'
import { searchCities } from '@/lib/shared/utils/cities'
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
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/use-debounce'

const STEPS = [
  { id: 1, title: 'Trajet' },
  { id: 2, title: 'Capacité' },
  { id: 3, title: 'Confirmation' },
] as const

export default function NewAnnouncementPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMode, setSubmitMode] = useState<'publish' | 'draft' | null>(null)
  const [departureCitySuggestions, setDepartureCitySuggestions] = useState<
    string[]
  >([])
  const [arrivalCitySuggestions, setArrivalCitySuggestions] = useState<
    string[]
  >([])
  const [showDepartureSuggestions, setShowDepartureSuggestions] =
    useState(false)
  const [showArrivalSuggestions, setShowArrivalSuggestions] = useState(false)
  const submitIntentRef = useRef<'publish' | 'draft' | null>(null)

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
      departure_country: DEPARTURE_COUNTRY,
      arrival_country: ARRIVAL_COUNTRY,
      available_kg: 5,
      price_per_kg: 10,
    },
  })

  const departureCity = watch('departure_city')
  const arrivalCity = watch('arrival_city')
  const departureDate = watch('departure_date')
  const availableKg = watch('available_kg')

  const debouncedDepartureCity = useDebounce(departureCity || '', 300)
  const debouncedArrivalCity = useDebounce(arrivalCity || '', 300)

  // Recherche autocomplete pour ville de départ (France)
  useEffect(() => {
    if (debouncedDepartureCity) {
      searchCities(DEPARTURE_COUNTRY, debouncedDepartureCity).then(
        setDepartureCitySuggestions
      )
    } else {
      setDepartureCitySuggestions([])
    }
  }, [debouncedDepartureCity])

  // Recherche autocomplete pour ville d'arrivée (Bénin)
  useEffect(() => {
    if (debouncedArrivalCity) {
      searchCities(ARRIVAL_COUNTRY, debouncedArrivalCity).then(
        setArrivalCitySuggestions
      )
    } else {
      setArrivalCitySuggestions([])
    }
  }, [debouncedArrivalCity])

  const handleNext = async () => {
    console.log(
      '[NewAnnouncement] handleNext called - currentStep:',
      currentStep
    )

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
      fieldsToValidate = ['available_kg']
    }

    const isValid = await trigger(fieldsToValidate)
    console.log('[NewAnnouncement] Validation result:', isValid)
    if (isValid) {
      const newStep = Math.min(currentStep + 1, 3)
      console.log('[NewAnnouncement] Moving to step:', newStep)
      setCurrentStep(newStep)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const onSubmit = async (data: CreateAnnouncementInput) => {
    console.log('[NewAnnouncement] onSubmit called - currentStep:', currentStep)
    console.log('[NewAnnouncement] Form data:', data)

    // Protection : ne soumettre que si on est à l'étape 3
    if (currentStep !== 3) {
      console.log('[NewAnnouncement] Submit blocked - not on step 3')
      return
    }

    if (!submitIntentRef.current) {
      console.log('[NewAnnouncement] Submit blocked - no explicit confirmation')
      return
    }

    const intent = submitIntentRef.current
    submitIntentRef.current = null
    setIsSubmitting(true)
    try {
      const result = await createAnnouncement({ ...data, intent })

      if (result.error) {
        toast.error(result.error)
        // Si erreur KYC, rediriger vers la page KYC
        if (result.field === 'kyc') {
          router.push('/dashboard/reglages/kyc')
        }
        return
      }

      if (result.success && result.announcementId) {
        toast.success(
          result.message ||
            "Votre trajet est publié. Vous recevrez des demandes d'expéditeurs."
        )

        // Invalider les queries pour forcer le rafraîchissement
        queryClient.invalidateQueries({ queryKey: ['user-announcements'] })

        router.push('/dashboard/annonces')
      }
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
      setSubmitMode(null)
    }
  }

  const handlePublishClick = () => {
    setSubmitMode('publish')
    submitIntentRef.current = 'publish'
    void handleSubmit(onSubmit)()
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
        title="Enregistrer mon voyage"
        description="Publiez votre trajet et recevez des demandes de transport"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Voyages', href: '/dashboard/annonces' },
          { label: 'Nouveau voyage' },
        ]}
      />

      {/* Indicateur d'étapes */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <div
              className="absolute left-4 right-4 top-4 z-0 h-0.5 rounded-full bg-primary origin-left transition-transform"
              style={{
                transform: `scaleX(${(currentStep - 1) / (STEPS.length - 1)})`,
              }}
            />

            <div className="relative z-10 grid grid-cols-3 gap-4">
              {STEPS.map(step => {
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id

                return (
                  <div
                    key={step.id}
                    className="flex flex-col items-center text-center"
                  >
                    <div
                      className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors ${
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : isCompleted
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-muted bg-muted text-muted-foreground'
                      }`}
                    >
                      <span className="text-sm font-semibold">{step.id}</span>
                    </div>
                    <p
                      className={`mt-3 text-sm font-medium ${
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={e => {
          // Bloquer Enter sauf si on est à l'étape 3 et qu'on est sur le bouton submit
          if (e.key === 'Enter' && currentStep !== 3) {
            e.preventDefault()
            console.log(
              '[NewAnnouncement] Enter key blocked - not on final step'
            )
          }
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && 'Informations du trajet'}
              {currentStep === 2 && 'Capacité disponible'}
              {currentStep === 3 && 'Récapitulatif'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Renseignez les détails de votre trajet'}
              {currentStep === 2 &&
                'Indiquez votre capacité disponible et votre tarif au kilo'}
              {currentStep === 3 &&
                'Vérifiez vos informations avant de soumettre votre voyage à Sendbox'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Étape 1 : Trajet */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Colonne DÉPART */}
                <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Départ
                  </h3>

                  {/* Pays de départ — fixé à France pour V1 */}
                  <div className="space-y-2">
                    <Label>Pays de départ</Label>
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                      <span>🇫🇷</span>
                      <span>France</span>
                    </div>
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
                          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <IconCalendar className="mr-2 h-4 w-4" />
                          {departureDate
                            ? format(departureDate, 'PP', { locale: fr })
                            : 'Sélectionner une date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        side="bottom"
                        align="start"
                      >
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
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.departure_date && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.departure_date.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Colonne ARRIVÉE */}
                <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Arrivée
                  </h3>

                  {/* Pays d'arrivée — fixé à Bénin pour V1 */}
                  <div className="space-y-2">
                    <Label>Pays d'arrivée</Label>
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                      <span>🇧🇯</span>
                      <span>Bénin</span>
                    </div>
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
                          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <IconCalendar className="mr-2 h-4 w-4" />
                          {watch('arrival_date')
                            ? format(watch('arrival_date')!, 'PP', {
                                locale: fr,
                              })
                            : 'Sélectionner une date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        side="bottom"
                        align="start"
                      >
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
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.arrival_date && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.arrival_date.message}
                      </p>
                    )}
                  </div>
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
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Trajet</span>
                    <span className="text-sm text-muted-foreground">
                      {departureCity} · France →{' '}
                      {arrivalCity} · Bénin
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>
                      Départ :{' '}
                      {departureDate &&
                        format(departureDate, 'PP', { locale: fr })}
                    </div>
                    <div>
                      Arrivée :{' '}
                      {watch('arrival_date') &&
                        format(watch('arrival_date')!, 'PP', { locale: fr })}
                    </div>
                    <div>Poids dispo : {availableKg} kg</div>
                    {watch('description') && (
                      <div className="col-span-2">
                        Note : {watch('description')}
                      </div>
                    )}
                  </div>
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
                <IconArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>

              {currentStep < 3 ? (
                <Button type="button" onClick={handleNext}>
                  Suivant
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handlePublishClick}
                  disabled={isSubmitting}
                >
                  {isSubmitting && submitMode === 'publish' ? (
                    <>
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Soumettre mon voyage'
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
