/**
 * Page de notation d'un service
 */

'use client'

import { useState, useEffect, useTransition, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Star, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { StarRating } from '@/components/features/ratings/StarRating'
import { ratingSchema, RATING_SUGGESTIONS, type RatingInput } from "@/lib/core/ratings/validations"
import { submitRating, canRateBooking } from "@/lib/core/ratings/actions"
import { cn } from "@/lib/utils"

function RatingPageContent() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const [canRate, setCanRate] = useState<{
    canRate: boolean
    ratedUserName?: string
    error?: string
    alreadyRated?: boolean
  } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)

  const form = useForm<RatingInput>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      booking_id: bookingId,
      rating: 0,
      comment: '',
    },
  })

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form

  const rating = watch('rating')
  const comment = watch('comment')

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

  const handleSuggestionClick = (suggestion: string) => {
    const currentComment = comment || ''
    const newComment = currentComment
      ? `${currentComment} ${suggestion}`
      : suggestion
    setValue('comment', newComment, { shouldValidate: true })
    setSelectedSuggestion(suggestion)
  }

  const onSubmit = async (data: RatingInput) => {
    if (data.rating === 0) {
      toast.error('Veuillez sélectionner un nombre d\'étoiles')
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <p className="text-center text-muted-foreground">
              {canRate.error}
            </p>
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
                <p className="text-sm text-destructive">{errors.rating.message}</p>
              )}
            </div>

            {/* Suggestions rapides */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Suggestions rapides</label>
              <div className="flex flex-wrap gap-2">
                {RATING_SUGGESTIONS.map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant={selectedSuggestion === suggestion ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Commentaire */}
            <div className="space-y-2">
              <label htmlFor="comment" className="text-sm font-medium">
                Commentaire (optionnel)
              </label>
              <Textarea
                id="comment"
                {...form.register('comment')}
                placeholder="Partagez votre expérience..."
                className="min-h-[100px]"
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {comment?.length || 0} / 500 caractères
                </span>
                {errors.comment && (
                  <span className="text-destructive">{errors.comment.message}</span>
                )}
              </div>
            </div>

            {/* Bouton submit */}
            <Button
              type="submit"
              disabled={isPending || rating === 0}
              className="w-full"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <RatingPageContent />
    </Suspense>
  )
}





