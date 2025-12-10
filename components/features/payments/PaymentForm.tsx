/**
 * Composant formulaire de paiement Stripe Elements
 */

'use client'

import { useState, FormEvent } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PaymentFormProps {
  bookingId: string
  amount: number
  acceptedTerms: boolean
  onSuccess: () => void
}

export function PaymentForm({
  bookingId,
  amount,
  acceptedTerms,
  onSuccess,
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    if (!acceptedTerms) {
      toast.error('Veuillez accepter les conditions générales')
      return
    }

    setIsProcessing(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/colis/${bookingId}?payment=success`,
        },
        redirect: 'if_required',
      })

      if (error) {
        toast.error(
          error.message || 'Une erreur est survenue lors du paiement'
        )
        setIsProcessing(false)
        return
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Paiement confirmé avec succès !')
        onSuccess()
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Une erreur est survenue. Veuillez réessayer.')
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isProcessing}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={!stripe || !acceptedTerms || isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Traitement...
            </>
          ) : (
            `Payer ${amount.toFixed(2)} €`
          )}
        </Button>
      </div>
    </form>
  )
}

