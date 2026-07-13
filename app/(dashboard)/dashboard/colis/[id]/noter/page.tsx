/**
 * Page de notation d'un service
 */

'use client'

import { useState, useEffect, useTransition, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconLoader2, IconSend } from '@tabler/icons-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { StarRating } from '@/components/features/ratings/StarRating'
import {
  getReviewCriteriaForRole,
  ratingSchema,
  type RatingInput,
  type ReviewRole,
} from '@/lib/core/ratings/validations'
import { submitRating, canRateBooking } from '@/lib/core/ratings/actions'

function RatingPageContent() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const [canRate, setCanRate] = useState<{
    canRate: boolean
    ratedUserName?: string
    reviewerRole?: ReviewRole
    error?: string
    alreadyRated?: boolean
  } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([])

  const form = useForm<RatingInput>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      booking_id: bookingId,
      rating: 0,
      comment: '',
      criteria: [],
    },
  })

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = form

  const rating = useWatch({ control: form.control, name: 'rating' }) ?? 0
  const comment = useWatch({ control: form.control, name: 'comment' }) ?? ''
  const criteria = useWatch({ control: form.control, name: 'criteria' }) ?? []
  const availableCriteria = canRate?.reviewerRole
    ? getReviewCriteriaForRole(canRate.reviewerRole)
    : []

  useEffect(() => {
    const checkCanRate = async () => {
      const result = await canRateBooking(bookingId)
      setCanRate(result)
    }
    checkCanRate()
  }, [bookingId])

  const handleRatingChange = (value: number) => {
    setValue('rating', value, { shouldValidate: true })
  }

  const handleCriterionToggle = (criterion: string) => {
    const nextCriteria = selectedCriteria.includes(criterion)
      ? selectedCriteria.filter(item => item !== criterion)
      : selectedCriteria.length < 4
        ? [...selectedCriteria, criterion]
        : selectedCriteria

    setSelectedCriteria(nextCriteria)
    setValue('criteria', nextCriteria as RatingInput['criteria'], {
      shouldValidate: true,
    })
  }

  const onSubmit = async (data: RatingInput) => {
    if (data.rating === 0) {
      toast.error("Veuillez sélectionner un nombre d'étoiles")
      return
    }

    if (data.criteria.length === 0) {
      toast.error('Selectionnez au moins un critere')
      return
    }

    startTransition(async () => {
      const result = await submitRating(data)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success(result.message)
        router.push(`/dashboard/colis/${bookingId}`)
      }
    })
  }

  if (canRate === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!canRate.canRate) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Noter le service"
          description="Évaluez votre expérience"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Mes colis', href: '/dashboard/colis' },
            { label: 'Noter' },
          ]}
        />
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{canRate.error}</p>
            {canRate.alreadyRated && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => router.back()}>
                  Retour
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Noter le service"
        description={`Comment s'est passé votre service avec ${canRate.ratedUserName} ?`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mes colis', href: '/dashboard/colis' },
          { label: 'Noter' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Votre avis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rating avec étoiles */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Note</label>
              <StarRating
                rating={rating}
                onRatingChange={handleRatingChange}
                size="lg"
              />
              {errors.rating && (
                <p className="text-sm text-destructive">
                  {errors.rating.message}
                </p>
              )}
            </div>

            {/* Criteres */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Criteres observes</label>
              <div className="flex flex-wrap gap-2">
                {availableCriteria.map(criterion => (
                  <Badge
                    key={criterion}
                    variant={
                      criteria.includes(criterion) ? 'default' : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => handleCriterionToggle(criterion)}
                  >
                    {criterion}
                  </Badge>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{criteria.length} / 4 criteres selectionnes</span>
                {errors.criteria && (
                  <span className="text-destructive">
                    {errors.criteria.message}
                  </span>
                )}
              </div>
            </div>

            {/* Commentaire */}
            <div className="space-y-2">
              <label htmlFor="comment" className="text-sm font-medium">
                Commentaire
              </label>
              <Textarea
                id="comment"
                {...form.register('comment')}
                placeholder="Partagez votre expérience..."
                className="min-h-[100px]"
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{comment?.length || 0} / 500 caractères</span>
                {errors.comment && (
                  <span className="text-destructive">
                    {errors.comment.message}
                  </span>
                )}
              </div>
            </div>

            {/* Bouton submit */}
            <Button
              type="submit"
              disabled={
                isPending ||
                rating === 0 ||
                criteria.length === 0 ||
                comment.trim().length < 20
              }
              className="w-full"
              size="lg"
            >
              {isPending ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <IconSend className="mr-2 h-4 w-4" />
                  Envoyer l'avis
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

export default function RatingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <RatingPageContent />
    </Suspense>
  )
}
