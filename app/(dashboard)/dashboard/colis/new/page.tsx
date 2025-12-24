/**
 * Page de création de réservation
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  createBookingSchema,
  type CreateBookingInput,
} from "@/lib/core/bookings/validations"
import {
  createBooking,
  getAnnouncementForBooking,
} from "@/lib/core/bookings/actions"
import {
  calculateBookingPrice,
  formatPrice,
} from "@/lib/core/bookings/calculations"
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { PriceCalculation } from '@/components/features/bookings/PriceCalculation'
import { TripTimeline } from '@/components/features/announcements/TripTimeline'
import { toast } from 'sonner'
import {
  Loader2,
  Upload,
  X,
  Star,
  Package,
  Euro,
  Shield,
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { generateInitials } from "@/lib/core/profile/utils"
import { MAX_PHOTOS, MAX_FILE_SIZE, validatePackagePhoto } from "@/lib/core/bookings/photos"
import { LoadingSpinner } from '@/components/ui/loading-spinner'

function NewBookingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const announcementId = searchParams.get('announcement') || ''
  const initialWeight = searchParams.get('weight')
    ? parseFloat(searchParams.get('weight')!)
    : undefined

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [announcement, setAnnouncement] = useState<any>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateBookingInput & { package_photos?: File[] }>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      announcement_id: announcementId,
      kilos_requested: initialWeight || 1,
      package_value: 0,
      insurance_opted: false as boolean,
    },
  })

  const weightKg = watch('kilos_requested') || 0
  const packageValue = watch('package_value') || 0
  const insuranceOpted = watch('insurance_opted') || false
  const pricePerKg = announcement?.price_per_kg || 0

  // Calcul tarifaire en temps réel
  const calculation = calculateBookingPrice(
    weightKg,
    pricePerKg,
    packageValue,
    insuranceOpted
  )

  useEffect(() => {
    if (announcementId) {
      loadAnnouncement()
    } else {
      toast.error('Annonce non spécifiée')
      router.push('/recherche')
    }
  }, [announcementId])

  const loadAnnouncement = async () => {
    setIsLoading(true)
    try {
      const result = await getAnnouncementForBooking(announcementId)

      if (result.error) {
        toast.error(result.error)
        router.push('/recherche')
        return
      }

      if (result.announcement) {
        setAnnouncement(result.announcement)
        setValue('announcement_id', result.announcement.id)
        if (initialWeight) {
          setValue(
            'kilos_requested',
            Math.min(initialWeight, result.announcement.available_weight)
          )
        }
      }
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'annonce')
      router.push('/recherche')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []
    const previews: string[] = []

    files.forEach((file) => {
      const validation = validatePackagePhoto(file)
      if (validation.valid && photos.length + validFiles.length < MAX_PHOTOS) {
        validFiles.push(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          previews.push(reader.result as string)
          if (previews.length === validFiles.length) {
            setPhotoPreviews((prev) => [...prev, ...previews])
          }
        }
        reader.readAsDataURL(file)
      } else if (!validation.valid) {
        toast.error(validation.error)
      }
    })

    if (validFiles.length > 0) {
      setPhotos((prev) => [...prev, ...validFiles])
      setValue('package_photos', [...photos, ...validFiles])
    }

    if (photos.length + validFiles.length >= MAX_PHOTOS) {
      toast.info(`Maximum ${MAX_PHOTOS} photos autorisées`)
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
    setValue(
      'package_photos',
      photos.filter((_, i) => i !== index)
    )
  }

  const onSubmit = async (
    data: CreateBookingInput & { package_photos?: File[] }
  ) => {
    setIsSubmitting(true)
    try {
      const result = await createBooking({
        ...data,
        package_photos: photos.length > 0 ? photos : undefined,
      })

      if (result.error) {
        toast.error(result.error)
        if (result.field === 'kyc') {
          router.push('/dashboard/reglages/kyc')
        }
        return
      }

      if (result.success && result.bookingId) {
        toast.success(result.message)
        router.push(`/dashboard/colis/${result.bookingId}/paiement`)
      }
    } catch (error) {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!announcement) {
    return null
  }

  const travelerName = `${announcement.traveler_first_name || ''} ${announcement.traveler_last_name || ''}`.trim() || 'Voyageur'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Créer une réservation"
        description="Remplissez les informations de votre colis"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mes colis', href: '/dashboard/colis' },
          { label: 'Nouvelle réservation' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations annonce */}
          <Card>
            <CardHeader>
              <CardTitle>Annonce sélectionnée</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TripTimeline
                originCity={announcement.origin_city}
                originCountry={announcement.origin_country}
                destinationCity={announcement.destination_city}
                destinationCountry={announcement.destination_country}
                departureDate={announcement.departure_date}
              />

              <div className="flex items-center gap-3 pt-4 border-t">
                <Avatar>
                  <AvatarImage
                    src={announcement.traveler_avatar_url || undefined}
                    alt={travelerName}
                  />
                  <AvatarFallback>
                    {generateInitials(
                      announcement.traveler_first_name,
                      announcement.traveler_last_name
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{travelerName}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">4.5</span>
                  </div>
                </div>
                <Badge variant="default" className="ml-auto">
                  {formatPrice(pricePerKg)} / kg
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations du colis</CardTitle>
                <CardDescription>
                  Renseignez les détails de votre colis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Poids */}
                <div className="space-y-2">
                  <Label htmlFor="kilos_requested">
                    Poids à réserver (kg)
                  </Label>
                  <Input
                    id="kilos_requested"
                    type="number"
                    step="0.5"
                    min={0.5}
                    max={announcement.available_weight}
                    {...register('kilos_requested', {
                      valueAsNumber: true,
                    })}
                    aria-invalid={errors.kilos_requested ? 'true' : 'false'}
                  />
                  {errors.kilos_requested && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.kilos_requested.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Maximum disponible : {announcement.available_weight} kg
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="package_description">
                    Description du colis
                  </Label>
                  <Textarea
                    id="package_description"
                    placeholder="Décrivez votre colis en détail..."
                    rows={4}
                    {...register('package_description')}
                    aria-invalid={
                      errors.package_description ? 'true' : 'false'
                    }
                  />
                  {errors.package_description && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.package_description.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Minimum 10 caractères, maximum 500
                  </p>
                </div>

                {/* Valeur déclarée */}
                <div className="space-y-2">
                  <Label htmlFor="package_value">
                    Valeur déclarée (EUR)
                  </Label>
                  <Input
                    id="package_value"
                    type="number"
                    min={0}
                    max={10000}
                    step="0.01"
                    {...register('package_value', { valueAsNumber: true })}
                    aria-invalid={errors.package_value ? 'true' : 'false'}
                  />
                  {errors.package_value && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.package_value.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Entre 0 et 10 000 €
                  </p>
                </div>

                {/* Photos */}
                <div className="space-y-2">
                  <Label htmlFor="package_photos">
                    Photos du colis (optionnel, max {MAX_PHOTOS})
                  </Label>
                  <Input
                    id="package_photos"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handlePhotoChange}
                    disabled={photos.length >= MAX_PHOTOS}
                  />
                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {photoPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Maximum {MAX_PHOTOS} photos, {MAX_FILE_SIZE / 1_000_000} MB chacune
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Assurance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Assurance
                </CardTitle>
                <CardDescription>
                  Protégez votre colis pendant le transport
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="insurance_opted"
                    checked={insuranceOpted}
                    onCheckedChange={(checked) =>
                      setValue('insurance_opted', checked === true)
                    }
                  />
                  <div className="flex-1 space-y-2">
                    <Label
                      htmlFor="insurance_opted"
                      className="font-medium cursor-pointer"
                    >
                      Souscrire une assurance
                    </Label>
                    {insuranceOpted && (
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <p className="text-sm">
                          Prime : {formatPrice(calculation.insurancePremium || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Couverture jusqu'à{' '}
                          {formatPrice(calculation.insuranceCoverage || 0)}
                          {packageValue < 500 &&
                            ` (valeur déclarée : ${formatPrice(packageValue)})`}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Protection contre la perte et les dommages pendant le
                      transport
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Confirmer et payer'
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar : Calcul tarifaire */}
        <div>
          <PriceCalculation
            calculation={calculation}
            weightKg={weightKg}
            packageValue={packageValue}
          />
        </div>
      </div>
    </div>
  )
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NewBookingPageContent />
    </Suspense>
  )
}

