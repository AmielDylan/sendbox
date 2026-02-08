/**
 * Page KYC dans les réglages
 */

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
  IconAlertTriangle,
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { getStripeClient } from '@/lib/shared/services/stripe/config'
import { createClient } from '@/lib/shared/db/client'
import { getCountryFlagEmoji } from '@/lib/utils/countries'
import { prepareKYCAccount, startKYCVerification } from '@/lib/core/kyc/actions'
import { useAuth } from '@/hooks/use-auth'
import { getStripeConnectAllowedCountriesClient } from '@/lib/shared/stripe/connect-allowed-client'
import {
  getStripeIdentityDocumentTypes,
  STRIPE_IDENTITY_SUPPORTED_COUNTRIES,
} from '@/lib/shared/stripe/identity-documents'

type KYCStatus = 'pending' | 'approved' | 'rejected' | 'incomplete' | null
type DocumentType = 'passport' | 'national_id'

export default function KYCPage() {
  const [kycStatus, setKycStatus] = useState<KYCStatus>(null)
  const [displayStatus, setDisplayStatus] = useState<KYCStatus>(null)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [documentType, setDocumentType] = useState<DocumentType | ''>('')
  const [documentCountry, setDocumentCountry] = useState('')
  const [accountCountry, setAccountCountry] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [step, setStep] = useState<'document' | 'details'>('document')
  const [isPreparingAccount, setIsPreparingAccount] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [documentCountryOpen, setDocumentCountryOpen] = useState(false)
  const [documentCountrySearch, setDocumentCountrySearch] = useState('')
  const [accountCountryOpen, setAccountCountryOpen] = useState(false)
  const [accountCountrySearch, setAccountCountrySearch] = useState('')
  const pendingHoldUntilRef = useRef<number | null>(null)
  const pendingTimeoutRef = useRef<number | null>(null)
  const { profile, user } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const PENDING_MIN_MS = 30000
  const stripeConnectCountries = useMemo(
    () => getStripeConnectAllowedCountriesClient(),
    []
  )
  const stripeIdentitySet = useMemo(
    () => new Set<string>(STRIPE_IDENTITY_SUPPORTED_COUNTRIES),
    []
  )
  const connectCountrySet = useMemo(
    () => new Set<string>(stripeConnectCountries),
    [stripeConnectCountries]
  )
  const normalizedAccountCountry = accountCountry.trim().toUpperCase()
  const normalizedDocumentCountry = documentCountry.trim().toUpperCase()
  const isConnectCountrySupported =
    !normalizedAccountCountry ||
    connectCountrySet.has(normalizedAccountCountry)
  const isIdentityCountrySupported =
    !normalizedDocumentCountry ||
    stripeIdentitySet.has(normalizedDocumentCountry)
  const allowedDocumentTypes = useMemo(
    () => getStripeIdentityDocumentTypes(normalizedDocumentCountry),
    [normalizedDocumentCountry]
  )
  const canPrepareAccount =
    Boolean(
      documentType && normalizedDocumentCountry && normalizedAccountCountry
    ) &&
    isConnectCountrySupported &&
    isIdentityCountrySupported

  const stripePromise = useMemo(() => getStripeClient(), [])
  const supabase = useMemo(() => createClient(), [])

  const connectCountryOptions = useMemo(() => {
    const displayNames =
      typeof Intl !== 'undefined' && 'DisplayNames' in Intl
        ? new Intl.DisplayNames(['fr'], { type: 'region' })
        : null

    return stripeConnectCountries
      .map(code => ({
        code,
        name: displayNames?.of(code) || code,
        flag: getCountryFlagEmoji(code),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [stripeConnectCountries])

  const identityCountryOptions = useMemo(() => {
    const displayNames =
      typeof Intl !== 'undefined' && 'DisplayNames' in Intl
        ? new Intl.DisplayNames(['fr'], { type: 'region' })
        : null

    return STRIPE_IDENTITY_SUPPORTED_COUNTRIES.map(code => ({
      code,
      name: displayNames?.of(code) || code,
      flag: getCountryFlagEmoji(code),
    })).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [])

  const filteredConnectCountries = useMemo(() => {
    const query = accountCountrySearch.trim().toLowerCase()
    if (!query) {
      return connectCountryOptions
    }
    return connectCountryOptions.filter(
      country =>
        country.name.toLowerCase().includes(query) ||
        country.code.toLowerCase().includes(query)
    )
  }, [connectCountryOptions, accountCountrySearch])

  const filteredIdentityCountries = useMemo(() => {
    const query = documentCountrySearch.trim().toLowerCase()
    if (!query) {
      return identityCountryOptions
    }
    return identityCountryOptions.filter(
      country =>
        country.name.toLowerCase().includes(query) ||
        country.code.toLowerCase().includes(query)
    )
  }, [identityCountryOptions, documentCountrySearch])

  useEffect(() => {
    if (!normalizedDocumentCountry) {
      if (documentType) {
        setDocumentType('')
      }
      return
    }

    if (
      documentType &&
      !allowedDocumentTypes.includes(documentType as DocumentType)
    ) {
      setDocumentType((allowedDocumentTypes[0] as DocumentType) || '')
    }
  }, [allowedDocumentTypes, documentType, normalizedDocumentCountry])

  useEffect(() => {
    if (isAdmin) {
      setIsLoading(false)
      return
    }
    setIsLoading(false)
  }, [isAdmin])

  useEffect(() => {
    if (!profile) return
    if (!firstName && (profile as any)?.firstname) {
      setFirstName((profile as any).firstname as string)
    }
    if (!lastName && (profile as any)?.lastname) {
      setLastName((profile as any).lastname as string)
    }
    if (!email && ((profile as any)?.email || user?.email)) {
      setEmail(((profile as any)?.email as string) || user?.email || '')
    }
    if (!phone && (profile as any)?.phone) {
      setPhone((profile as any).phone as string)
    }
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
    if (!accountCountry && (profile as any)?.country) {
      setAccountCountry((profile as any).country as string)
    }
    if (!documentCountry && (profile as any)?.kyc_nationality) {
      setDocumentCountry((profile as any).kyc_nationality as string)
    }
  }, [
    profile,
    user,
    firstName,
    lastName,
    email,
    phone,
    birthDate,
    address,
    city,
    postalCode,
    accountCountry,
    documentCountry,
  ])

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
  }, [supabase, isAdmin, user?.id])

  useEffect(() => {
    if (!profile) return
    const nextStatus = (profile as any)?.kyc_status ?? null
    const nextSubmitted = (profile as any)?.kyc_submitted_at ?? null
    setKycStatus(nextStatus)
    setSubmittedAt(nextSubmitted)
  }, [profile?.kyc_status, profile?.kyc_submitted_at, profile])

  useEffect(() => {
    return () => {
      if (pendingTimeoutRef.current) {
        window.clearTimeout(pendingTimeoutRef.current)
        pendingTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (pendingTimeoutRef.current) {
      window.clearTimeout(pendingTimeoutRef.current)
      pendingTimeoutRef.current = null
    }

    if (kycStatus === 'pending') {
      pendingHoldUntilRef.current = Date.now() + PENDING_MIN_MS
      setDisplayStatus('pending')
      return
    }

    if (kycStatus === 'approved') {
      const holdUntil = pendingHoldUntilRef.current
      if (holdUntil && Date.now() < holdUntil) {
        setDisplayStatus('pending')
        pendingTimeoutRef.current = window.setTimeout(() => {
          setDisplayStatus('approved')
          pendingHoldUntilRef.current = null
        }, holdUntil - Date.now())
        return () => {
          if (pendingTimeoutRef.current) {
            window.clearTimeout(pendingTimeoutRef.current)
            pendingTimeoutRef.current = null
          }
        }
      }
    }

    if (kycStatus !== 'pending') {
      pendingHoldUntilRef.current = null
    }
    setDisplayStatus(kycStatus)

    return () => {
      if (pendingTimeoutRef.current) {
        window.clearTimeout(pendingTimeoutRef.current)
        pendingTimeoutRef.current = null
      }
    }
  }, [kycStatus])

  const handleStartVerification = async () => {
    if (step !== 'details') {
      toast.error('Préparez votre compte avant de continuer')
      return
    }
    if (!documentType || !documentCountry || !accountCountry) {
      toast.error(
        'Veuillez sélectionner un pays de résidence et un document'
      )
      return
    }
    if (!firstName || !lastName || !email || !phone) {
      toast.error('Veuillez compléter vos informations personnelles')
      return
    }
    if (!birthDate || !address || !city || !postalCode) {
      toast.error('Veuillez compléter vos informations personnelles')
      return
    }

    setFormError(null)
    setIsSubmitting(true)

    try {
      const result = await startKYCVerification({
        firstName,
        lastName,
        email,
        phone,
        documentType: documentType as DocumentType,
        documentCountry,
        accountCountry,
        birthday: birthDate,
        address,
        city,
        postalCode,
      })

      if (result.error) {
        setFormError(result.error)
        toast.error(result.error)
        return
      }

      const stripe = await stripePromise
      if (!stripe) {
        toast.error("Le service de vérification n'est pas disponible. Réessayez.")
        return
      }

      if (!result.verificationClientSecret) {
        const message = "Impossible d'initialiser la vérification."
        setFormError(message)
        toast.error(message)
        return
      }

      const { error } = await stripe.verifyIdentity(
        result.verificationClientSecret
      )

      if (error) {
        const message =
          error.message ||
            "La vérification d'identité n'a pas pu être complétée."
        setFormError(message)
        toast.error(message)
        return
      }

      toast.success('Vérification envoyée avec succès.')
      const submittedAt = new Date().toISOString()
      setKycStatus('pending')
      setSubmittedAt(submittedAt)
    } catch {
      const message = 'Une erreur est survenue. Veuillez réessayer.'
      setFormError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrepareAccount = async () => {
    if (!documentType || !documentCountry || !accountCountry) {
      toast.error(
        'Veuillez sélectionner un pays de résidence et un document'
      )
      return
    }

    setIsPreparingAccount(true)
    try {
    const result = await prepareKYCAccount({
      accountCountry: normalizedAccountCountry || accountCountry,
      documentCountry: normalizedDocumentCountry || documentCountry,
    })
      if (result.error) {
        toast.error(result.error)
        return
      }

      setStep('details')
      toast.success('Compte prêt pour la vérification')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la préparation'
      )
    } finally {
      setIsPreparingAccount(false)
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
    switch (displayStatus ?? kycStatus) {
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

      {displayStatus !== 'approved' && (
        <Card>
          <CardHeader>
            <CardTitle>Lancer la vérification d'identité</CardTitle>
            <CardDescription>
              Sélectionnez votre document puis continuez la vérification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {displayStatus !== 'pending' && step === 'document' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="accountCountry">Pays de résidence</Label>
                  <Popover
                    open={accountCountryOpen}
                    onOpenChange={open => {
                      setAccountCountryOpen(open)
                      if (!open) {
                        setAccountCountrySearch('')
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={accountCountryOpen}
                        className="w-full justify-between"
                        id="accountCountry"
                      >
                        {accountCountry ? (
                          <span className="flex items-center gap-2">
                            <span>
                              {
                                connectCountryOptions.find(
                                  country => country.code === accountCountry
                                )?.flag
                              }
                            </span>
                            <span>
                              {
                                connectCountryOptions.find(
                                  country => country.code === accountCountry
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
                      sideOffset={4}
                      className="w-[--radix-popover-trigger-width] p-0"
                    >
                      <div className="flex items-center gap-2 border-b px-3 py-2">
                        <IconSearch className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher un pays..."
                          value={accountCountrySearch}
                          onChange={event =>
                            setAccountCountrySearch(event.target.value)
                          }
                          className="h-8 border-0 px-0 focus-visible:ring-0"
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {filteredConnectCountries.length > 0 ? (
                          filteredConnectCountries.map(country => (
                            <button
                              key={country.code}
                              type="button"
                              className={cn(
                                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-accent',
                                accountCountry === country.code && 'bg-accent'
                              )}
                              onClick={() => {
                                setAccountCountry(country.code)
                                setAccountCountryOpen(false)
                                setAccountCountrySearch('')
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

                <div className="space-y-2">
                  <Label htmlFor="documentCountry">
                    Pays d&apos;émission du document à vérifier
                  </Label>
                  <Popover
                    open={documentCountryOpen}
                    onOpenChange={open => {
                      setDocumentCountryOpen(open)
                      if (!open) {
                        setDocumentCountrySearch('')
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={documentCountryOpen}
                        className="w-full justify-between"
                        id="documentCountry"
                      >
                        {documentCountry ? (
                          <span className="flex items-center gap-2">
                            <span>
                              {
                                identityCountryOptions.find(
                                  country => country.code === documentCountry
                                )?.flag
                              }
                            </span>
                            <span>
                              {
                                identityCountryOptions.find(
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
                      sideOffset={4}
                      className="w-[--radix-popover-trigger-width] p-0"
                    >
                      <div className="flex items-center gap-2 border-b px-3 py-2">
                        <IconSearch className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher un pays..."
                          value={documentCountrySearch}
                          onChange={event =>
                            setDocumentCountrySearch(event.target.value)
                          }
                          className="h-8 border-0 px-0 focus-visible:ring-0"
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {filteredIdentityCountries.length > 0 ? (
                          filteredIdentityCountries.map(country => (
                            <button
                              key={country.code}
                              type="button"
                              className={cn(
                                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-accent',
                                documentCountry === country.code && 'bg-accent'
                              )}
                              onClick={() => {
                                setDocumentCountry(country.code)
                                setDocumentCountryOpen(false)
                                setDocumentCountrySearch('')
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

                <div className="space-y-2">
                  <Label htmlFor="documentType">Type de document</Label>
                  <Select
                    value={documentType}
                    onValueChange={value =>
                      setDocumentType(value as DocumentType)
                    }
                    disabled={
                      !normalizedDocumentCountry || !isIdentityCountrySupported
                    }
                  >
                    <SelectTrigger id="documentType">
                      <SelectValue
                        placeholder={
                          normalizedDocumentCountry && isIdentityCountrySupported
                            ? 'Sélectionnez un document'
                            : 'Choisissez d’abord un pays'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent side="bottom" align="start">
                      {allowedDocumentTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type === 'passport'
                            ? 'Passeport'
                            : "Carte nationale d'identité"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!isConnectCountrySupported && accountCountry && (
                  <Alert>
                    <IconAlertTriangle className="h-4 w-4" />
                    <AlertTitle>Pays de résidence non supporté</AlertTitle>
                    <AlertDescription>
                      Stripe Connect n&apos;est pas disponible pour ce pays de
                      résidence pour le moment. Choisissez un pays pris en
                      charge ou utilisez Mobile Wallet pour recevoir vos
                      paiements.
                    </AlertDescription>
                  </Alert>
                )}

                {!isIdentityCountrySupported && documentCountry && (
                  <Alert>
                    <IconAlertTriangle className="h-4 w-4" />
                    <AlertTitle>Pays de document non supporté</AlertTitle>
                    <AlertDescription>
                      Stripe Identity n&apos;est pas disponible pour ce pays de
                      document. Choisissez un pays pris en charge ou utilisez
                      un document accepté par Stripe.
                    </AlertDescription>
                  </Alert>
                )}


                <Button
                  type="button"
                  className="mt-4 w-full"
                  onClick={handlePrepareAccount}
                  disabled={isPreparingAccount || !canPrepareAccount}
                >
                  {isPreparingAccount ? (
                    <>
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      Préparation en cours...
                    </>
                  ) : (
                    'Continuer'
                  )}
                </Button>
              </>
            )}

            {displayStatus !== 'pending' && step === 'details' && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3">
                  <div className="text-sm">
                    <span className="font-medium">Résidence :</span>{' '}
                    {accountCountry || '—'} •{' '}
                    <span className="font-medium">Document :</span>{' '}
                    {documentType === 'passport'
                      ? 'Passeport'
                      : "Carte d'identité"}{' '}
                    • <span className="font-medium">Pays :</span>{' '}
                    {documentCountry || '—'}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setStep('document')}
                    disabled={isSubmitting}
                  >
                    Modifier
                  </Button>
                </div>

                <div className="space-y-4 rounded-lg border border-border/60 p-4">
                  <p className="text-sm font-semibold">
                    Informations personnelles
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        placeholder="Amiel"
                        value={firstName}
                        onChange={event => setFirstName(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        placeholder="Adjovi"
                        value={lastName}
                        onChange={event => setLastName(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={event => setEmail(event.target.value)}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        placeholder="+33612345678"
                        value={phone}
                        onChange={event => setPhone(event.target.value)}
                      />
                    </div>
                  </div>
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
                      La vérification est opérée par un prestataire sécurisé.
                      Nous ne stockons pas vos documents, uniquement le statut
                      de vérification et les informations déclarées.
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
                {formError && (
                  <p className="text-sm text-destructive">{formError}</p>
                )}
              </>
            )}
            {displayStatus === 'pending' && (
              <Alert className="border-primary/20 bg-primary/5">
                <IconClock className="h-4 w-4" />
                <AlertTitle>Merci, votre vérification est en cours</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>
                    Nous analysons vos documents. Vous pouvez revenir plus tard,
                    l&apos;application se mettra à jour automatiquement.
                  </p>
                  <Button asChild size="sm">
                    <Link href="/dashboard">Retour au tableau de bord</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
