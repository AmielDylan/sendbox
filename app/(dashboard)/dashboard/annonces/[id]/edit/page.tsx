/**
 * Page d'édition de voyage
 */

'use client'

import { use, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import {
  createAnnouncementSchema,
  type CreateAnnouncementInput,
} from '@/lib/core/announcements/validations'
import { updateAnnouncement } from '@/lib/core/announcements/management'
import { LocationSelects } from '@/components/forms/LocationSelects'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
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
  IconMapPin,
  IconPackage,
  IconCalendar,
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/shared/db/client'

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<CreateAnnouncementInput>({
    resolver: zodResolver(createAnnouncementSchema),
  })

  const departureDate = watch('departure_date')
  const availableKg = watch('available_kg')

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
      setValue('departure_country', data.departure_country)
      setValue('departure_city', data.departure_city)
      setValue('arrival_country', data.arrival_country)
      setValue('arrival_city', data.arrival_city)

      // Convertir les dates ISO en dates locales
      const parseDateFromDB = (dateString: string) => {
        const dateOnly = dateString.split('T')[0]
        const [year, month, day] = dateOnly.split('-').map(Number)
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
    } catch {
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
        title="Modifier mon voyage"
        description="Mettez à jour les informations de votre trajet"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Voyages', href: '/dashboard/annonces' },
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
              <LocationSelects
                prefix="departure"
                label="Pays et ville de départ"
                control={control}
                errors={{
                  country: errors.departure_country,
                  city: errors.departure_city,
                }}
              />

              <LocationSelects
                prefix="arrival"
                label="Pays et ville d'arrivée"
                control={control}
                errors={{
                  country: errors.arrival_country,
                  city: errors.arrival_city,
                }}
              />
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
                    {watch('arrival_date')
                      ? format(watch('arrival_date')!, 'PP', { locale: fr })
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
                <p className="text-sm text-destructive">
                  {errors.arrival_date.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Capacité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconPackage className="h-5 w-5" />
              Capacité disponible
            </CardTitle>
            <CardDescription>
              Ajustez votre capacité disponible pour les expéditeurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="available_kg">Capacité disponible</Label>
                <span className="text-2xl font-bold">{availableKg} kg</span>
              </div>
              <Slider
                value={[availableKg || 5]}
                onValueChange={value => setValue('available_kg', value[0])}
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
