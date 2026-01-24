/**
 * Page de paiement
 */

'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Elements } from '@stripe/react-stripe-js'
import { getStripeClient } from "@/lib/shared/services/stripe/config"
import { createClient } from "@/lib/shared/db/client"
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  IconLoader2,
  IconLock,
  IconShield,
  IconFileText,
  IconCircleCheck,
  IconInfoCircle,
  IconCreditCard,
} from '@tabler/icons-react'
import { formatPrice } from "@/lib/core/bookings/calculations"
import { calculateBookingAmounts } from "@/lib/core/payments/calculations"
import { INSURANCE_RATE, MAX_INSURANCE_COVERAGE } from "@/lib/core/bookings/validations"
import { PaymentForm } from '@/components/features/payments/PaymentForm'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Link from 'next/link'
import { getPaymentsMode } from '@/lib/shared/config/features'

type PaymentAmounts = ReturnType<typeof calculateBookingAmounts>

function PaymentPageContent() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  const paymentsMode = getPaymentsMode()
  const isStripe = paymentsMode === 'stripe'
  const isSimulation = paymentsMode === 'simulation'
  const paymentsEnabled = paymentsMode !== 'disabled'
  const protectionTooltip =
    'Cette option ne constitue pas un contrat d\'assurance et n\'implique aucune indemnisation automatique. Toute prise en charge éventuelle relève d\'une décision discrétionnaire de Sendbox. L\'utilisateur ne peut pas dire qu\'il ne savait pas. Plafond : 500 € max. Prix : 3% du montant déclaré.'

  const [isLoading, setIsLoading] = useState(true)
  const [booking, setBooking] = useState<any>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [amounts, setAmounts] = useState<PaymentAmounts | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [stripePromise] = useState(() => getStripeClient())
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const loadBooking = useCallback(async () => {
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
            departure_city,
            arrival_city,
            departure_country,
            arrival_country,
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
      if (bookingData.paid_at || bookingData.status === 'paid') {
        toast.info('Cette réservation est déjà payée')
        router.push(`/dashboard/colis/${bookingId}`)
        return
      }

      setBooking(bookingData)

      const computedAmounts = calculateBookingAmounts(
        bookingData.kilos_requested || 0,
        bookingData.price_per_kg || bookingData.announcements?.price_per_kg || 0,
        bookingData.package_value || 0,
        bookingData.insurance_opted || false
      )

      setAmounts(computedAmounts)

      if (isStripe) {
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

        const { clientSecret: secret } = await response.json()
        setClientSecret(secret)
      } else {
        setClientSecret(null)
      }
    } catch (error) {
      console.error('Error loading booking:', error)
      toast.error('Erreur lors du chargement de la réservation')
      router.push('/dashboard/colis')
    } finally {
      setIsLoading(false)
    }
  }, [bookingId, isStripe, router])

  useEffect(() => {
    if (!paymentsEnabled) {
      setIsLoading(false)
      return
    }

    loadBooking()
  }, [loadBooking, paymentsEnabled])

  const handleSimulatedPayment = async () => {
    if (!isSimulation || isProcessingPayment) {
      return
    }

    setIsProcessingPayment(true)
    toast.info('Paiement en cours de traitement...')

    try {
      const delayMs = 2000 + Math.floor(Math.random() * 2000)
      await new Promise((resolve) => setTimeout(resolve, delayMs))

      const response = await fetch('/api/payments/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ booking_id: bookingId }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors du paiement')
        return
      }

      router.push(`/dashboard/colis/${bookingId}?payment=success`)
    } catch (error) {
      console.error('Simulated payment error:', error)
      toast.error('Erreur lors du paiement')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!paymentsEnabled) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Paiement indisponible"
          description="La fonctionnalité de paiement est désactivée."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Mes colis', href: '/dashboard/colis' },
            { label: 'Paiement' },
          ]}
        />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Les paiements ne sont pas disponibles pour le moment.
            </p>
            <Button asChild>
              <Link href={`/dashboard/colis/${bookingId}`}>
                Retour à la réservation
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!booking) {
    return null
  }

  if (isStripe && !clientSecret) {
    return null
  }

  const announcement = booking.announcements as any
  const totalPrice = Number(amounts?.totalPrice ?? booking.total_price ?? 0)
  const commissionAmount = Number(amounts?.commissionAmount ?? booking.commission_amount ?? 0)
  const protectionAmount = booking.insurance_opted
    ? Number(amounts?.insurancePremium ?? booking.insurance_premium ?? 0)
    : 0
  const totalAmount = Number(amounts?.totalAmount ?? totalPrice + commissionAmount + protectionAmount)
  const protectionCoverage = Math.min(booking.package_value || 0, MAX_INSURANCE_COVERAGE)
  const protectionRateLabel = `${(INSURANCE_RATE * 100).toFixed(0)}%`

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
                  {announcement.departure_city} → {announcement.arrival_city}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Poids</p>
                <p className="font-medium">{booking.kilos_requested} kg</p>
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
                    <IconShield className="h-4 w-4 text-primary" />
                    <div>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        Protection du colis
                        <IconInfoCircle
                          className="h-3.5 w-3.5 text-muted-foreground"
                          title={protectionTooltip}
                          aria-label="Conditions de protection du colis"
                        />
                      </p>
                      <p className="font-medium">Option activée</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Mentions légales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconFileText className="h-5 w-5" />
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
                    <IconShield className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="flex items-center gap-1 font-medium text-sm">
                        Protection du colis activée
                        <IconInfoCircle
                          className="h-3.5 w-3.5 text-muted-foreground"
                          title={protectionTooltip}
                          aria-label="Conditions de protection du colis"
                        />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Assistance limitée en cas de litige. Plafond : {formatPrice(protectionCoverage)}.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Prix : {protectionRateLabel} du montant déclaré.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isStripe ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconLock className="h-5 w-5" />
                  Informations de paiement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientSecret ? (
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
                      amount={totalAmount}
                      acceptedTerms={acceptedTerms}
                      onSuccess={() => {
                        router.push(`/dashboard/colis/${bookingId}?payment=success`)
                      }}
                    />
                  </Elements>
                ) : (
                  <div className="flex items-center justify-center p-8">
                    <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconLock className="h-5 w-5" />
                  Informations de paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <IconCreditCard className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Carte bancaire</p>
                      <p className="text-xs text-muted-foreground">
                        Traitement en quelques secondes après validation.
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleSimulatedPayment}
                  disabled={!acceptedTerms || isProcessingPayment}
                  className="w-full"
                >
                  {isProcessingPayment ? (
                    <>
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      Paiement en cours...
                    </>
                  ) : (
                    'Confirmer le paiement'
                  )}
                </Button>
                {!acceptedTerms && (
                  <p className="text-xs text-muted-foreground text-center">
                    Acceptez les conditions pour continuer.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
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
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Commission Sendbox
                  </span>
                  <span className="font-medium">
                    {formatPrice(commissionAmount)}
                  </span>
                </div>
                {booking.insurance_opted && (
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      Protection du colis
                      <IconInfoCircle
                        className="h-3.5 w-3.5 text-muted-foreground"
                        title={protectionTooltip}
                        aria-label="Conditions de protection du colis"
                      />
                    </span>
                    <span className="font-medium">
                      {formatPrice(protectionAmount)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconCircleCheck className="h-4 w-4 text-green-500" />
                  <span>Paiement sécurisé par Sendbox</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconLock className="h-4 w-4 text-primary" />
                  <span>Fonds bloqués jusqu'à livraison</span>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <IconShield className="h-4 w-4 text-primary mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Séquestre des fonds
                    </p>
                    <p>
                      Les fonds restent bloqués sur la plateforme jusqu'à la
                      confirmation de livraison par le demandeur.
                    </p>
                    <p>
                      Si le voyageur confirme la livraison et que vous ne répondez
                      pas malgré les relances, les fonds sont libérés après 7 jours.
                    </p>
                  </div>
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
