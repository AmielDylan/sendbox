'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

export function MatchingFeeGate({
  clientSecret,
  amountCents,
  onSuccess,
}: {
  clientSecret: string
  amountCents: number
  onSuccess: () => void
}) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret, locale: 'fr' }}>
      <FeeForm amountCents={amountCents} onSuccess={onSuccess} />
    </Elements>
  )
}

function FeeForm({
  amountCents,
  onSuccess,
}: {
  amountCents: number
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePay = async () => {
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Paiement échoué.')
      setLoading(false)
      return
    }

    onSuccess()
  }

  const euros = (amountCents / 100).toFixed(2).replace('.', ',')

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-background p-5 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold">Frais de mise en relation</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Le voyageur a confirmé. Réglez {euros} € pour valider la mise en
          relation et accéder à ses coordonnées.
        </p>
      </div>

      <PaymentElement />

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={handlePay}
        disabled={loading || !stripe}
        aria-busy={loading}
      >
        {loading ? 'Paiement en cours...' : `Payer ${euros} € et confirmer`}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Frais uniques pour cette mise en relation. Le règlement au voyageur se
        fait directement entre vous.
      </p>
    </div>
  )
}
