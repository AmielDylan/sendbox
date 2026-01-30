/**
 * Page KYC dans les réglages
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  IconLoader2,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconShieldLock,
  IconChevronDown,
  IconSearch,
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { getStripeClient } from '@/lib/shared/services/stripe/config'
import { createClient } from '@/lib/shared/db/client'
import { COUNTRY_OPTIONS } from '@/lib/utils/countries'
import { getKYCStatus, startKYCVerification } from '@/lib/core/kyc/actions'
import { FEATURES } from '@/lib/shared/config/features'

type KYCStatus = 'pending' | 'approved' | 'rejected' | 'incomplete' | null
type DocumentType = 'passport' | 'national_id'

export default function KYCPage() {
  const [kycStatus, setKycStatus] = useState<KYCStatus>(null)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [connectStatus, setConnectStatus] = useState<{
    payouts_enabled: boolean
    onboarding_completed: boolean
    requirements: any
  } | null>(null)
  const [isConnectLoading, setIsConnectLoading] = useState(true)
  const [isOnboarding, setIsOnboarding] = useState(false)
  const [connectAvailable, setConnectAvailable] = useState(true)
  const [documentType, setDocumentType] = useState<DocumentType | ''>('')
  const [documentCountry, setDocumentCountry] = useState('')
  const [countryOpen, setCountryOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')

  const stripePromise = useMemo(() => getStripeClient(), [])
  const supabase = useMemo(() => createClient(), [])

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase()
    if (!query) {
      return COUNTRY_OPTIONS
    }
    return COUNTRY_OPTIONS.filter(
      country =>
        country.name.toLowerCase().includes(query) ||
        country.code.toLowerCase().includes(query)
    )
  }, [countrySearch])

  useEffect(() => {
    loadKYCStatus()
  }, [])

  useEffect(() => {
    if (!FEATURES.STRIPE_PAYMENTS) {
      setIsConnectLoading(false)
      return
    }

    let isActive = true

    const loadConnectStatus = async () => {
      try {
        const res = await fetch('/api/connect/status')
        if (!isActive) return

        if (res.status === 403) {
          setConnectAvailable(false)
          setIsConnectLoading(false)
          return
        }

        if (!res.ok) {
          throw new Error('Erreur lors du chargement')
        }

        const data = await res.json()
        setConnectStatus(data)
      } catch (error) {
        console.error('Connect status error:', error)
      } finally {
        if (isActive) {
          setIsConnectLoading(false)
        }
      }
    }

    loadConnectStatus()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let isActive = true

    const subscribeToProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !isActive) return

      console.log('🔔 Subscribing to KYC updates for user:', user.id)

      const suffix =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)

      channel = supabase
        .channel(`kyc-profile:${user.id}:${suffix}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          payload => {
            console.log('🔔 Realtime UPDATE received:', payload)
            const nextProfile = payload.new as {
              kyc_status?: KYCStatus
              kyc_submitted_at?: string | null
            }
            console.log('📊 New KYC status:', nextProfile.kyc_status)
            setKycStatus(nextProfile.kyc_status ?? null)
            setSubmittedAt(nextProfile.kyc_submitted_at ?? null)
          }
        )
        .subscribe(status => {
          console.log('📡 Realtime subscription status:', status)
          if (status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime KYC subscription error')
          }
        })
    }

    subscribeToProfile()

    return () => {
      isActive = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase])

  const loadKYCStatus = async () => {
    setIsLoading(true)
    try {
      const result = await getKYCStatus()
      if (result.error) {
        toast.error(result.error)
      } else {
        setKycStatus(result.status as KYCStatus)
        setSubmittedAt(result.submittedAt || null)
      }
    } catch {
      toast.error('Erreur lors du chargement du statut KYC')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartVerification = async () => {
    if (!documentType || !documentCountry) {
      toast.error('Veuillez sélectionner un document et un pays')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await startKYCVerification({
        documentType: documentType as DocumentType,
        documentCountry,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      const stripe = await stripePromise
      if (!stripe) {
        toast.error("Stripe n'est pas encore disponible. Réessayez.")
        return
      }

      if (!result.verificationClientSecret) {
        toast.error("Impossible d'initialiser Stripe Identity.")
        return
      }

      const { error } = await stripe.verifyIdentity(
        result.verificationClientSecret
      )

      if (error) {
        toast.error(
          error.message ||
            "La vérification d'identité n'a pas pu être complétée."
        )
        return
      }

      toast.success('Vérification envoyée avec succès.')
      await loadKYCStatus()
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConnectOnboarding = async () => {
    setIsOnboarding(true)
    try {
      const res = await fetch('/api/connect/onboard', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data?.error || 'Impossible de démarrer la vérification')
        return
      }
      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
      } else {
        toast.error('Lien de vérification indisponible')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsOnboarding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const connectBadgeLabel = isConnectLoading
    ? 'Chargement...'
    : connectStatus?.payouts_enabled
      ? 'Activé'
      : 'À compléter'

  const getStatusBadge = () => {
    switch (kycStatus) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-500">
            <IconCircleCheck className="mr-1 h-3 w-3" />
            Approuvé
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive">
            <IconCircleX className="mr-1 h-3 w-3" />
            Rejeté
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="warning">
            <IconClock className="mr-1 h-3 w-3" />
            En attente
          </Badge>
        )
      case 'incomplete':
        return (
          <Badge variant="warning" className="cursor-default">
            À compléter
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vérification d'identité (KYC)"
        description="Stripe Identity se charge de vérifier vos documents."
      />

      {FEATURES.STRIPE_PAYMENTS && connectAvailable && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Activer les paiements</CardTitle>
                <CardDescription>
                  Recevez vos gains directement sur votre compte bancaire.
                </CardDescription>
              </div>
              <Badge
                variant={
                  connectStatus?.payouts_enabled ? 'default' : 'warning'
                }
                className={cn(
                  connectStatus?.payouts_enabled && 'bg-green-500 text-white'
                )}
              >
                {connectBadgeLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Étapes requises pour recevoir vos paiements :</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Vérification d'identité</li>
                <li>Ajouter votre compte bancaire</li>
              </ul>
              <p>
                Paiement sécurisé, libéré après confirmation ou automatiquement
                sous 7 jours.
              </p>
            </div>

            <Button
              onClick={handleConnectOnboarding}
              disabled={
                isOnboarding ||
                isConnectLoading ||
                connectStatus?.payouts_enabled
              }
            >
              {isOnboarding
                ? 'En cours...'
                : connectStatus?.payouts_enabled
                  ? 'Paiements activés'
                  : 'Activer les paiements'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Statut actuel */}
      <Card>
        <CardHeader>
          <CardTitle>Statut de votre KYC</CardTitle>
          <CardDescription>
            {kycStatus === 'approved' &&
              'Votre identité a été vérifiée. Toutes les actions sont débloquées.'}
            {kycStatus === 'pending' &&
              "Votre vérification est en cours d'examen. Vous serez notifié par email."}
            {kycStatus === 'rejected' &&
              'Votre vérification a été refusée. Vous pouvez relancer une vérification.'}
            {(kycStatus === 'incomplete' || !kycStatus) &&
              'Aucune vérification en cours. Lancez Stripe Identity pour continuer.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {getStatusBadge()}
            {submittedAt && (
              <p className="text-sm text-muted-foreground">
                Soumis le {format(new Date(submittedAt), 'PP', { locale: fr })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {kycStatus !== 'approved' && (
        <Card>
          <CardHeader>
            <CardTitle>Lancer la vérification Stripe Identity</CardTitle>
            <CardDescription>
              Sélectionnez votre document puis continuez sur Stripe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Type de document */}
            <div className="space-y-2">
              <Label htmlFor="documentType">Type de document</Label>
              <Select
                value={documentType}
                onValueChange={value => setDocumentType(value as DocumentType)}
              >
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Sélectionnez un document" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passeport</SelectItem>
                  <SelectItem value="national_id">
                    Carte nationale d&apos;identité
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pays d'émission */}
            <div className="space-y-2">
              <Label htmlFor="documentCountry">
                Pays d&apos;émission du document
              </Label>
              <Popover
                open={countryOpen}
                onOpenChange={open => {
                  setCountryOpen(open)
                  if (!open) {
                    setCountrySearch('')
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryOpen}
                    className="w-full justify-between"
                    id="documentCountry"
                  >
                    {documentCountry ? (
                      <span className="flex items-center gap-2">
                        <span>
                          {
                            COUNTRY_OPTIONS.find(
                              country => country.code === documentCountry
                            )?.flag
                          }
                        </span>
                        <span>
                          {
                            COUNTRY_OPTIONS.find(
                              country => country.code === documentCountry
                            )?.name
                          }
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Sélectionnez un pays
                      </span>
                    )}
                    <IconChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="start"
                  className="w-[--radix-popover-trigger-width] p-0"
                >
                  <div className="flex items-center gap-2 border-b px-3 py-2">
                    <IconSearch className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un pays..."
                      value={countrySearch}
                      onChange={event => setCountrySearch(event.target.value)}
                      className="h-8 border-0 px-0 focus-visible:ring-0"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map(country => (
                        <button
                          key={country.code}
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-accent',
                            documentCountry === country.code && 'bg-accent'
                          )}
                          onClick={() => {
                            setDocumentCountry(country.code)
                            setCountryOpen(false)
                            setCountrySearch('')
                          }}
                        >
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {country.code}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-muted-foreground">
                        Aucun pays trouvé.
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Alert>
              <IconShieldLock className="h-4 w-4" />
              <AlertTitle>Sécurité & confidentialité</AlertTitle>
              <AlertDescription>
                <p>
                  La vérification est opérée par Stripe Identity. Nous ne
                  stockons pas vos documents, uniquement le statut de
                  vérification et les informations déclarées.
                </p>
                <ul className="mt-2 list-disc list-inside text-xs text-muted-foreground">
                  <li>Données chiffrées pendant le transfert.</li>
                  <li>Utilisation strictement liée à la conformité KYC.</li>
                  <li>Vous pouvez relancer la vérification si besoin.</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              type="button"
              className="w-full"
              disabled={isSubmitting || kycStatus === 'pending'}
              onClick={handleStartVerification}
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ouverture de Stripe Identity...
                </>
              ) : (
                'Vérifier mon identité'
              )}
            </Button>
            {kycStatus === 'pending' && (
              <p className="text-xs text-muted-foreground text-center">
                Vérification en cours. Vous recevrez un email dès validation.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
