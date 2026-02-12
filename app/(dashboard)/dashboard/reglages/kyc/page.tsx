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
import type { Stripe } from '@stripe/stripe-js'
import { getStripeClient } from '@/lib/shared/services/stripe/config'
import { createClient } from '@/lib/shared/db/client'
import { getCountryFlagEmoji } from '@/lib/utils/countries'
import { prepareKYCAccount, startKYCVerification } from '@/lib/core/kyc/actions'
import { useAuth } from '@/hooks/use-auth'
import { getResidenceCountries } from '@/lib/shared/kyc/residence-countries'
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
  const [verificationSessionId, setVerificationSessionId] = useState<
    string | null
  >(null)
  const [forceDetails, setForceDetails] = useState(false)
  const pendingHoldUntilRef = useRef<number | null>(null)
  const pendingTimeoutRef = useRef<number | null>(null)
  const statusSyncTimeoutRef = useRef<number | null>(null)
  const { profile, user } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const PENDING_MIN_MS = 30000
  const residenceCountries = useMemo(() => getResidenceCountries(), [])
  const stripeIdentitySet = useMemo(
    () => new Set<string>(STRIPE_IDENTITY_SUPPORTED_COUNTRIES),
    []
  )
  const stripeConnectCountrySet = useMemo(
    () => new Set(getStripeConnectAllowedCountriesClient()),
    []
  )
  const residenceCountrySet = useMemo(
    () => new Set<string>(residenceCountries),
    [residenceCountries]
  )
  const profileAccountCountry = (profile as any)?.country as string | undefined
  const profileDocumentCountry = (profile as any)?.kyc_nationality as
    | string
    | undefined
  const profileDocumentType = (profile as any)?.kyc_document_type as
    | DocumentType
    | undefined
  const effectiveAccountCountry = accountCountry || profileAccountCountry || ''
  const effectiveDocumentCountry =
    documentCountry || profileDocumentCountry || ''
  const effectiveDocumentType =
    documentType || profileDocumentType || ('' as DocumentType | '')
  const normalizedAccountCountry = effectiveAccountCountry.trim().toUpperCase()
  const normalizedDocumentCountry = effectiveDocumentCountry
    .trim()
    .toUpperCase()
  const isStripeConnectCountry =
    Boolean(normalizedAccountCountry) &&
    stripeConnectCountrySet.has(normalizedAccountCountry as any)
  const isResidenceCountrySupported =
    !normalizedAccountCountry ||
    residenceCountrySet.has(normalizedAccountCountry)
  const isIdentityCountrySupported =
    !normalizedDocumentCountry ||
    stripeIdentitySet.has(normalizedDocumentCountry)
  const allowedDocumentTypes = useMemo(
    () => getStripeIdentityDocumentTypes(normalizedDocumentCountry),
    [normalizedDocumentCountry]
  )
  const canPrepareAccount =
    Boolean(
      effectiveDocumentType &&
      normalizedDocumentCountry &&
      normalizedAccountCountry
    ) &&
    isResidenceCountrySupported &&
    isIdentityCountrySupported

  const stripePromise = useMemo(() => getStripeClient(), [])
  const supabase = useMemo(() => createClient(), [])

  const connectCountryOptions = useMemo(() => {
    const displayNames =
      typeof Intl !== 'undefined' && 'DisplayNames' in Intl
        ? new Intl.DisplayNames(['fr'], { type: 'region' })
        : null

    return residenceCountries
      .map(code => ({
        code,
        name: displayNames?.of(code) || code,
        flag: getCountryFlagEmoji(code),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [residenceCountries])

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

  const parseDob = (value?: string) => {
    if (!value) return null
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!match) return null
    const [, year, month, day] = match
    return {
      day: Number(day),
      month: Number(month),
      year: Number(year),
    }
  }

  const buildIndividualPayload = (options: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    birthDate?: string
    address?: string
    city?: string
    postalCode?: string
    country?: string
  }) => {
    const individual: Record<string, unknown> = {}

    if (options.firstName?.trim()) {
      individual.first_name = options.firstName.trim()
    }
    if (options.lastName?.trim()) {
      individual.last_name = options.lastName.trim()
    }
    if (options.email?.trim()) {
      individual.email = options.email.trim()
    }
    if (options.phone?.trim()) {
      individual.phone = options.phone.trim()
    }
    const dob = parseDob(options.birthDate)
    if (dob) {
      individual.dob = dob
    }

    if (
      options.address?.trim() ||
      options.city?.trim() ||
      options.postalCode?.trim()
    ) {
      individual.address = {
        line1: options.address?.trim() || undefined,
        city: options.city?.trim() || undefined,
        postal_code: options.postalCode?.trim() || undefined,
        country: options.country?.trim() || undefined,
      }
    }

    return individual
  }

  const createAccountToken = async (
    stripe: Stripe,
    individual: Record<string, unknown>
  ) => {
    const accountPayload = {
      business_type: 'individual',
      tos_shown_and_accepted: true,
    } as any

    if (Object.keys(individual).length > 0) {
      accountPayload.individual = individual
    }

    const tokenResult = await stripe.createToken('account', accountPayload)
    if (tokenResult.error || !tokenResult.token?.id) {
      throw new Error(
        tokenResult.error?.message ||
          'Impossible de préparer le compte de paiement.'
      )
    }

    return tokenResult.token.id
  }

  // No page-level loading state needed; UI reacts to profile changes.

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
    if (!accountCountry && profileAccountCountry) {
      setAccountCountry(profileAccountCountry)
    }
    if (!documentCountry && profileDocumentCountry) {
      setDocumentCountry(profileDocumentCountry)
    }
    if (!documentType && profileDocumentType) {
      setDocumentType(profileDocumentType)
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
    documentType,
    profileAccountCountry,
    profileDocumentCountry,
    profileDocumentType,
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
    if (nextStatus === 'approved' || nextStatus === 'rejected') {
      setForceDetails(false)
      setVerificationSessionId(null)
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('kyc_verification_session_id')
      }
    }
    if (nextStatus === 'rejected') {
      setStep('details')
      setForceDetails(true)
    }
    if (nextStatus === 'incomplete') {
      const hasDocument = Boolean((profile as any)?.kyc_document_type)
      const hasNationality = Boolean((profile as any)?.kyc_nationality)
      if (hasDocument && hasNationality) {
        setStep('details')
        setForceDetails(true)
      }
    }
  }, [profile?.kyc_status, profile?.kyc_submitted_at, profile])

  useEffect(() => {
    return () => {
      if (pendingTimeoutRef.current) {
        window.clearTimeout(pendingTimeoutRef.current)
        pendingTimeoutRef.current = null
      }
      if (statusSyncTimeoutRef.current) {
        window.clearTimeout(statusSyncTimeoutRef.current)
        statusSyncTimeoutRef.current = null
      }
    }
  }, [])

  const runStatusSync = async (
    sessionId: string,
    attempt: number
  ): Promise<void> => {
    try {
      const res = await fetch('/api/stripe/identity/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        return
      }

      if (data?.kycStatus) {
        setKycStatus(data.kycStatus)
        if (data.submittedAt) {
          setSubmittedAt(data.submittedAt)
        }
        if (data.kycStatus === 'rejected') {
          setFormError(
            data.rejectionReason ||
              "La vérification d'identité a échoué. Corrigez vos informations."
          )
          setStep('details')
          setForceDetails(true)
          pendingHoldUntilRef.current = null
        }
        if (data.kycStatus !== 'pending') {
          return
        }
      }

      if (data?.status === 'processing' && attempt < 5) {
        const delay = attempt === 0 ? 5000 : attempt === 1 ? 10000 : 15000
        statusSyncTimeoutRef.current = window.setTimeout(() => {
          runStatusSync(sessionId, attempt + 1)
        }, delay)
      }
    } catch {
      // Silent fallback; webhook remains the primary source.
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (kycStatus !== 'pending') return
    const stored = sessionStorage.getItem('kyc_verification_session_id')
    if (!stored) return
    setVerificationSessionId(stored)
    runStatusSync(stored, 0)
  }, [kycStatus])

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

    pendingHoldUntilRef.current = null
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
    if (
      !effectiveDocumentType ||
      !normalizedDocumentCountry ||
      !normalizedAccountCountry
    ) {
      toast.error('Veuillez sélectionner un pays de résidence et un document')
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
      const stripe = await stripePromise
      if (!stripe) {
        toast.error(
          "Le service de vérification n'est pas disponible. Réessayez."
        )
        return
      }

      let accountTokenId: string | undefined
      if (isStripeConnectCountry) {
        const individualPayload = buildIndividualPayload({
          firstName,
          lastName,
          email,
          phone,
          birthDate,
          address,
          city,
          postalCode,
          country: normalizedAccountCountry,
        })
        accountTokenId = await createAccountToken(stripe, individualPayload)
      }

      if (profileAccountCountry && !accountCountry) {
        setAccountCountry(profileAccountCountry)
      }
      if (profileDocumentCountry && !documentCountry) {
        setDocumentCountry(profileDocumentCountry)
      }
      if (profileDocumentType && !documentType) {
        setDocumentType(profileDocumentType)
      }

      const result = await startKYCVerification({
        firstName,
        lastName,
        email,
        phone,
        documentType: effectiveDocumentType as DocumentType,
        documentCountry: normalizedDocumentCountry,
        accountCountry: normalizedAccountCountry,
        birthday: birthDate,
        address,
        city,
        postalCode,
        accountTokenId,
      })

      if (result.error) {
        setFormError(result.error)
        toast.error(result.error)
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

      if (result.verificationSessionId) {
        setVerificationSessionId(result.verificationSessionId)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            'kyc_verification_session_id',
            result.verificationSessionId
          )
        }
      }

      toast.success('Vérification envoyée avec succès.')
      const submittedAt = new Date().toISOString()
      setKycStatus('pending')
      setSubmittedAt(submittedAt)
      setForceDetails(false)

      const sessionId = result.verificationSessionId
      if (sessionId) {
        await runStatusSync(sessionId, 0)
      }
    } catch {
      const message = 'Une erreur est survenue. Veuillez réessayer.'
      setFormError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrepareAccount = async () => {
    if (
      !effectiveDocumentType ||
      !normalizedDocumentCountry ||
      !normalizedAccountCountry
    ) {
      toast.error('Veuillez sélectionner un pays de résidence et un document')
      return
    }

    setIsPreparingAccount(true)
    try {
      let accountTokenId: string | undefined
      if (isStripeConnectCountry) {
        const stripe = await stripePromise
        if (!stripe) {
          throw new Error("Le service de paiement n'est pas disponible.")
        }

        const individualPayload = buildIndividualPayload({
          firstName,
          lastName,
          email,
          phone,
          birthDate,
          address,
          city,
          postalCode,
          country: normalizedAccountCountry,
        })
        accountTokenId = await createAccountToken(stripe, individualPayload)
      }

      const result = await prepareKYCAccount({
        accountCountry: normalizedAccountCountry,
        documentCountry: normalizedDocumentCountry,
        documentType: effectiveDocumentType as DocumentType,
        accountTokenId,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }

      if (pendingTimeoutRef.current) {
        window.clearTimeout(pendingTimeoutRef.current)
        pendingTimeoutRef.current = null
      }
      pendingHoldUntilRef.current = null
      setSubmittedAt(null)
      setKycStatus('incomplete')
      setDisplayStatus('incomplete')
      setFormError(null)
      setStep('details')
      setForceDetails(true)
      toast.success('Compte prêt pour la vérification')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la préparation'
      )
    } finally {
      setIsPreparingAccount(false)
    }
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

  const getKycMessage = () => {
    switch (displayStatus ?? kycStatus) {
      case 'pending':
        return "Votre vérification est en cours d'examen. Vous serez notifié par email."
      case 'rejected':
        return 'Votre vérification a été refusée. Corrigez vos informations puis relancez la procédure.'
      case 'incomplete':
        return 'Aucune vérification en cours. Lancez la vérification pour continuer.'
      default:
        return 'Sélectionnez votre document puis continuez la vérification.'
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vérification d'identité (KYC)"
        description="Nous vérifions vos documents pour sécuriser votre compte."
      />

      {displayStatus === 'approved' && (
        <div className="space-y-4 rounded-lg border border-border/60 bg-muted/30 p-4">
          <div className="flex flex-wrap items-center gap-3">
            {getStatusBadge()}
            <p className="text-sm font-semibold">Identité vérifiée</p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Votre identité est confirmée. Vous pouvez poursuivre vos actions
              sur Sendbox en toute sécurité.
            </p>
            {submittedAt && (
              <p>
                Soumis le {format(new Date(submittedAt), 'PP', { locale: fr })}
              </p>
            )}
          </div>
        </div>
      )}

      {displayStatus !== 'approved' && (
        <Card>
          <CardHeader>
            <CardTitle>Lancer la vérification d'identité</CardTitle>
            <CardDescription>{getKycMessage()}</CardDescription>
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
                          normalizedDocumentCountry &&
                          isIdentityCountrySupported
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

                {!isResidenceCountrySupported && accountCountry && (
                  <Alert>
                    <IconAlertTriangle className="h-4 w-4" />
                    <AlertTitle>Pays de résidence non supporté</AlertTitle>
                    <AlertDescription>
                      Pour le moment, seules la France et le Bénin sont
                      disponibles. Choisissez un pays pris en charge pour
                      continuer.
                    </AlertDescription>
                  </Alert>
                )}

                {!isIdentityCountrySupported && documentCountry && (
                  <Alert>
                    <IconAlertTriangle className="h-4 w-4" />
                    <AlertTitle>Pays de document non supporté</AlertTitle>
                    <AlertDescription>
                      Stripe Identity n&apos;est pas disponible pour ce pays de
                      document. Choisissez un pays pris en charge ou utilisez un
                      document accepté par Stripe.
                    </AlertDescription>
                  </Alert>
                )}

                {isPreparingAccount && (
                  <Alert>
                    <IconShieldLock className="h-4 w-4" />
                    <AlertTitle>Merci de patienter</AlertTitle>
                    <AlertDescription>
                      Nous mettons en place les configurations pour pouvoir
                      lancer la vérification de votre identité.
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

            {step === 'details' &&
              (displayStatus !== 'pending' || forceDetails) && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3">
                    <div className="text-sm">
                      <span className="font-medium">Résidence :</span>{' '}
                      {effectiveAccountCountry || '—'} •{' '}
                      <span className="font-medium">Document :</span>{' '}
                      {effectiveDocumentType === 'passport'
                        ? 'Passeport'
                        : effectiveDocumentType
                          ? "Carte d'identité"
                          : '—'}{' '}
                      • <span className="font-medium">Pays :</span>{' '}
                      {effectiveDocumentCountry || '—'}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStep('document')
                        setForceDetails(false)
                        setVerificationSessionId(null)
                        if (typeof window !== 'undefined') {
                          sessionStorage.removeItem(
                            'kyc_verification_session_id'
                          )
                        }
                      }}
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
                        placeholder="Adresse"
                        value={address}
                        onChange={event => setAddress(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        placeholder="Ville"
                        value={city}
                        onChange={event => setCity(event.target.value)}
                      />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Code postal</Label>
                      <Input
                        id="postalCode"
                        placeholder="Code postal"
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
                        <li>
                          Utilisation strictement liée à la conformité KYC.
                        </li>
                        <li>Vous pouvez relancer la vérification si besoin.</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <Button
                    type="button"
                    className="w-full"
                    disabled={
                      isSubmitting || (kycStatus === 'pending' && !forceDetails)
                    }
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
            {displayStatus === 'pending' && !forceDetails && (
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
