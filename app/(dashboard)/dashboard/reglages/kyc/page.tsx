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
import { useAuth } from '@/hooks/use-auth'

type KYCStatus = 'pending' | 'approved' | 'rejected' | 'incomplete' | null
type DocumentType = 'passport' | 'national_id'

export default function KYCPage() {
  const [kycStatus, setKycStatus] = useState<KYCStatus>(null)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [documentType, setDocumentType] = useState<DocumentType | ''>('')
  const [documentCountry, setDocumentCountry] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [countryOpen, setCountryOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

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
    if (isAdmin) {
      setIsLoading(false)
      return
    }
    loadKYCStatus()
  }, [isAdmin])

  useEffect(() => {
    if (!profile) return
    if (!birthDate && (profile as any)?.birthday) {
      setBirthDate((profile as any).birthday as string)
    }
    if (!address && (profile as any)?.address) {
      setAddress((profile as any).address as string)
    }
    if (!city && (profile as any)?.city) {
      setCity((profile as any).city as string)
    }
    if (!postalCode && (profile as any)?.postal_code) {
      setPostalCode((profile as any).postal_code as string)
    }
  }, [profile, birthDate, address, city, postalCode])

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let isActive = true

    const subscribeToProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user || !isActive || isAdmin) return

      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token)
      }

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
    if (!birthDate || !address || !city || !postalCode) {
      toast.error('Veuillez compléter vos informations personnelles')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await startKYCVerification({
        documentType: documentType as DocumentType,
        documentCountry,
        birthday: birthDate,
        address,
        city,
        postalCode,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      const stripe = await stripePromise
      if (!stripe) {
        toast.error("Le service de vérification n'est pas disponible. Réessayez.")
        return
      }

      if (!result.verificationClientSecret) {
        toast.error("Impossible d'initialiser la vérification.")
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Vérification d'identité"
          description="Nous vérifions vos documents pour sécuriser votre compte."
        />
        <Alert>
          <AlertTitle>Réservé aux utilisateurs</AlertTitle>
          <AlertDescription>
            L&apos;interface KYC est disponible uniquement pour les comptes
            utilisateurs.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

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
          description="Nous vérifions vos documents pour sécuriser votre compte."
      />

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
              "Aucune vérification en cours. Lancez la vérification pour continuer."}
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
            <CardTitle>Lancer la vérification d'identité</CardTitle>
            <CardDescription>
              Sélectionnez votre document puis continuez la vérification.
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

            <div className="space-y-4 rounded-lg border border-border/60 p-4">
              <p className="text-sm font-semibold">Informations personnelles</p>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Date de naissance</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={event => setBirthDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  placeholder="28 Route de Bonsecours"
                  value={address}
                  onChange={event => setAddress(event.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    placeholder="Paris"
                    value={city}
                    onChange={event => setCity(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Code postal</Label>
                  <Input
                    id="postalCode"
                    placeholder="75012"
                    value={postalCode}
                    onChange={event => setPostalCode(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <Alert>
              <IconShieldLock className="h-4 w-4" />
              <AlertTitle>Sécurité & confidentialité</AlertTitle>
              <AlertDescription>
                <p>
                  La vérification est opérée par un prestataire sécurisé. Nous ne
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
                  Ouverture de la vérification...
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
