/**
 * Page de paiement Stripe
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Elements } from '@stripe/react-stripe-js'
import { getStripeClient } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Lock, Shield, FileText, CheckCircle2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils/booking-calculations'
import { PaymentForm } from '@/components/features/payments/PaymentForm'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Link from 'next/link'

function PaymentPageContent() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [booking, setBooking] = useState<any>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [amount, setAmount] = useState<number>(0)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [stripePromise] = useState(() => getStripeClient())

  useEffect(() => {
    loadBooking()
  }, [bookingId])

  const loadBooking = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      // Récupérer le booking avec l'annonce
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .select(
          `
          *,
          announcements:announcement_id (
            origin_city,
            destination_city,
            origin_country,
            destination_country,
            departure_date,
            price_per_kg
          )
        `
        )
        .eq('id', bookingId)
        .single()

      if (error || !bookingData) {
        toast.error('Réservation introuvable')
        router.push('/dashboard/colis')
        return
      }

      // Vérifier que le booking n'est pas déjà payé
      if (bookingData.payment_intent_id && bookingData.paid_at) {
        toast.info('Cette réservation est déjà payée')
        router.push(`/dashboard/colis/${bookingId}`)
        return
      }

      setBooking(bookingData)

      // Créer le Payment Intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ booking_id: bookingId }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la création du paiement')
        router.push('/dashboard/colis')
        return
      }

      const { clientSecret: secret, amount: totalAmount } = await response.json()
      setClientSecret(secret)
      setAmount(totalAmount)
    } catch (error) {
      console.error('Error loading booking:', error)
      toast.error('Erreur lors du chargement de la réservation')
      router.push('/dashboard/colis')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!booking || !clientSecret) {
    return null
  }

  const announcement = booking.announcements as any

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paiement sécurisé"
        description="Finalisez votre réservation"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mes colis', href: '/dashboard/colis' },
          { label: 'Paiement' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de paiement */}
        <div className="lg:col-span-2 space-y-6">
          {/* Récapitulatif */}
          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif de votre réservation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Trajet</p>
                <p className="font-medium">
                  {announcement.origin_city} → {announcement.destination_city}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Poids</p>
                <p className="font-medium">{booking.weight_kg} kg</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Valeur déclarée</p>
                <p className="font-medium">{formatPrice(booking.package_value || 0)}</p>
              </div>
              {booking.insurance_opted && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Assurance</p>
                      <p className="font-medium">Souscrite</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stripe Elements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Informations de paiement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                  },
                }}
              >
                <PaymentForm
                  bookingId={bookingId}
                  amount={amount}
                  acceptedTerms={acceptedTerms}
                  onSuccess={() => {
                    router.push(`/dashboard/colis/${bookingId}?payment=success`)
                  }}
                />
              </Elements>
            </CardContent>
          </Card>

          {/* Mentions légales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Mentions légales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept_terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="accept_terms" className="cursor-pointer">
                    J'accepte les{' '}
                    <Link href="/cgv" className="text-primary underline">
                      Conditions Générales de Vente
                    </Link>{' '}
                    et la{' '}
                    <Link href="/politique-confidentialite" className="text-primary underline">
                      Politique de Confidentialité
                    </Link>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    En confirmant votre paiement, vous acceptez nos conditions
                    d'utilisation et notre politique de remboursement.
                  </p>
                </div>
              </div>

              {booking.insurance_opted && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium text-sm">Assurance souscrite</p>
                      <p className="text-xs text-muted-foreground">
                        Votre colis est couvert jusqu'à{' '}
                        {formatPrice(Math.min(booking.package_value || 0, 500))}{' '}
                        en cas de perte ou de dommage pendant le transport.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar : Montant */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Montant à payer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Transport</span>
                  <span className="font-medium">
                    {formatPrice(booking.total_price || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Commission Sendbox
                  </span>
                  <span className="font-medium">
                    {formatPrice(booking.commission_amount || 0)}
                  </span>
                </div>
                {booking.insurance_opted && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Assurance</span>
                    <span className="font-medium">
                      {formatPrice(booking.insurance_premium || 0)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(amount)}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Paiement sécurisé par Stripe</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4 text-primary" />
                  <span>Fonds bloqués jusqu'à livraison</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentPageContent />
    </Suspense>
  )
}

