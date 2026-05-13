/**
 * Page KYC dans les réglages — vérification manuelle
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
import { Checkbox } from '@/components/ui/checkbox'
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
  IconChevronDown,
  IconSearch,
  IconAlertTriangle,
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { createClient } from '@/lib/shared/db/client'
import { getCountryFlagEmoji } from '@/lib/utils/countries'
import { startKYCVerification } from '@/lib/core/kyc/actions'
import { useAuth } from '@/hooks/use-auth'
import { getResidenceCountries } from '@/lib/shared/kyc/residence-countries'
import type { DocumentType } from '@/lib/core/kyc/validations'

type KYCStatus = 'pending' | 'approved' | 'rejected' | 'incomplete' | null

export default function KYCPage() {
  const [kycStatus, setKycStatus] = useState<KYCStatus>(null)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [documentType, setDocumentType] = useState<DocumentType | ''>('')
  const [documentCountry, setDocumentCountry] = useState('')
  const [accountCountry, setAccountCountry] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [confirmIdentity, setConfirmIdentity] = useState(false)
  const [dialCode, setDialCode] = useState('+33')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [accountCountryOpen, setAccountCountryOpen] = useState(false)
  const [accountCountrySearch, setAccountCountrySearch] = useState('')
  const [documentCountryOpen, setDocumentCountryOpen] = useState(false)
  const [documentCountrySearch, setDocumentCountrySearch] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const { profile, user } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const residenceCountries = useMemo(() => getResidenceCountries(), [])
  const supabase = useMemo(() => createClient(), [])

  const profileAccountCountry = (profile as any)?.country as string | undefined
  const profileDocumentCountry = (profile as any)?.kyc_nationality as string | undefined
  const profileDocumentType = (profile as any)?.kyc_document_type as DocumentType | undefined

  const countryOptions = useMemo(() => {
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

  const allCountryOptions = useMemo(() => {
    const displayNames =
      typeof Intl !== 'undefined' && 'DisplayNames' in Intl
        ? new Intl.DisplayNames(['fr'], { type: 'region' })
        : null
    const extra = ['BJ', 'CM', 'SN', 'CI', 'MA', 'TN', 'DZ', 'US', 'CA']
      .filter(c => !residenceCountries.includes(c as any))
      .map(code => ({ code, name: displayNames?.of(code) || code, flag: getCountryFlagEmoji(code) }))
    const all: { code: string; name: string; flag: string }[] = [...countryOptions, ...extra]
    return all.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [countryOptions, residenceCountries])

  const filteredConnectCountries = useMemo(() => {
    const q = accountCountrySearch.trim().toLowerCase()
    if (!q) return countryOptions
    return countryOptions.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
  }, [countryOptions, accountCountrySearch])

  const filteredDocumentCountries = useMemo(() => {
    const q = documentCountrySearch.trim().toLowerCase()
    if (!q) return allCountryOptions
    return allCountryOptions.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
  }, [allCountryOptions, documentCountrySearch])

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!firstName.trim()) errors.firstName = 'Champ requis'
    if (!lastName.trim()) errors.lastName = 'Champ requis'
    if (!email.trim()) errors.email = 'Champ requis'
    if (!phone.trim()) errors.phone = 'Champ requis'
    if (!birthDate.trim()) errors.birthDate = 'Champ requis'
    if (!accountCountry) errors.accountCountry = 'Champ requis'
    if (!documentCountry) errors.documentCountry = 'Champ requis'
    if (!documentType) errors.documentType = 'Champ requis'
    if (!confirmIdentity) errors.confirmIdentity = 'Veuillez confirmer vos informations.'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      const firstField = Object.keys(errors)[0]
      const el = document.getElementById(firstField)
      if (el instanceof HTMLElement) el.focus()
      return false
    }
    return true
  }

  // Restore draft
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = sessionStorage.getItem('kyc_form_draft')
      if (!saved) return
      const draft = JSON.parse(saved)
      if (draft.firstName) setFirstName(draft.firstName)
      if (draft.lastName) setLastName(draft.lastName)
      if (draft.phone) setPhone(draft.phone)
      if (draft.birthDate) setBirthDate(draft.birthDate)
      if (draft.address) setAddress(draft.address)
      if (draft.city) setCity(draft.city)
      if (draft.postalCode) setPostalCode(draft.postalCode)
      if (draft.dialCode) setDialCode(draft.dialCode)
    } catch {}
  }, [])

  // Save draft
  useEffect(() => {
    if (typeof window === 'undefined') return
    const draft = { firstName, lastName, phone, birthDate, address, city, postalCode, dialCode }
    sessionStorage.setItem('kyc_form_draft', JSON.stringify(draft))
  }, [firstName, lastName, phone, birthDate, address, city, postalCode, dialCode])

  // Pre-fill from profile
  useEffect(() => {
    if (!profile) return
    if (!firstName && (profile as any)?.firstname) setFirstName((profile as any).firstname)
    if (!lastName && (profile as any)?.lastname) setLastName((profile as any).lastname)
    if (!email && ((profile as any)?.email || user?.email)) setEmail((profile as any)?.email || user?.email || '')
    if (!phone && (profile as any)?.phone) setPhone((profile as any).phone)
    if (!birthDate && (profile as any)?.birthday) setBirthDate((profile as any).birthday)
    if (!address && (profile as any)?.address) setAddress((profile as any).address)
    if (!city && (profile as any)?.city) setCity((profile as any).city)
    if (!postalCode && (profile as any)?.postal_code) setPostalCode((profile as any).postal_code)
    if (!accountCountry && profileAccountCountry) setAccountCountry(profileAccountCountry)
    if (!documentCountry && profileDocumentCountry) setDocumentCountry(profileDocumentCountry)
    if (!documentType && profileDocumentType) setDocumentType(profileDocumentType)
  }, [
    profile, user, firstName, lastName, email, phone, birthDate, address, city, postalCode,
    accountCountry, documentCountry, documentType,
    profileAccountCountry, profileDocumentCountry, profileDocumentType,
  ])

  // Sync status from profile
  useEffect(() => {
    if (!profile) return
    setKycStatus((profile as any)?.kyc_status ?? null)
    setSubmittedAt((profile as any)?.kyc_submitted_at ?? null)
  }, [(profile as any)?.kyc_status, (profile as any)?.kyc_submitted_at])

  // Realtime KYC updates
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let active = true

    const subscribe = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user || !active || isAdmin) return
      if (session.access_token) await supabase.realtime.setAuth(session.access_token)

      const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)

      channel = supabase
        .channel(`kyc-profile:${session.user.id}:${suffix}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${session.user.id}`,
        }, payload => {
          const next = payload.new as { kyc_status?: KYCStatus; kyc_submitted_at?: string | null }
          setKycStatus(next.kyc_status ?? null)
          setSubmittedAt(next.kyc_submitted_at ?? null)
        })
        .subscribe()
    }

    subscribe()
    return () => {
      active = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [supabase, isAdmin, user?.id])

  const handleSubmit = async () => {
    if (!validate()) {
      setFormError('Veuillez corriger les champs en erreur.')
      return
    }
    setFormError(null)
    setIsSubmitting(true)
    try {
      const result = await startKYCVerification({
        firstName,
        lastName,
        email,
        phone: `${dialCode}${phone}`,
        documentType: documentType as DocumentType,
        documentCountry: documentCountry.toUpperCase(),
        accountCountry: accountCountry.toUpperCase(),
        birthday: birthDate,
        address: address || undefined,
        city: city || undefined,
        postalCode: postalCode || undefined,
      })

      if (result.error) {
        setFormError(result.error)
        toast.error(result.error)
        return
      }

      toast.success('Vérification soumise. Notre équipe examinera votre dossier sous 24-48h.')
      if (typeof window !== 'undefined') sessionStorage.removeItem('kyc_form_draft')
      setKycStatus('pending')
      setSubmittedAt(new Date().toISOString())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue.'
      setFormError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Vérification d'identité"
          description="Nous vérifions vos documents pour sécuriser votre compte."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Réglages', href: '/dashboard/reglages/compte' },
            { label: 'KYC' },
          ]}
        />
        <Alert>
          <AlertTitle>Réservé aux utilisateurs</AlertTitle>
          <AlertDescription>
            L&apos;interface KYC est disponible uniquement pour les comptes utilisateurs.
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
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vérification d'identité (KYC)"
        description="Soumettez vos informations pour que notre équipe valide votre identité."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Réglages', href: '/dashboard/reglages/compte' },
          { label: 'KYC' },
        ]}
      />

      {kycStatus === 'approved' && (
        <div className="space-y-4 rounded-lg border border-border/60 bg-muted/30 p-4">
          <div className="flex flex-wrap items-center gap-3">
            {getStatusBadge()}
            <p className="text-sm font-semibold">Identité vérifiée</p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Votre identité est confirmée. Vous pouvez publier des annonces sur Sendbox.</p>
            {submittedAt && (
              <p>Soumis le {format(new Date(submittedAt), 'PP', { locale: fr })}</p>
            )}
          </div>
        </div>
      )}

      {kycStatus === 'pending' && (
        <Alert className="border-primary/20 bg-primary/5">
          <IconClock className="h-4 w-4" />
          <AlertTitle>Vérification en cours</AlertTitle>
          <AlertDescription>
            Votre dossier est en cours d&apos;examen par notre équipe (24-48h). Vous serez notifié par email.
            {submittedAt && (
              <span className="block mt-1 text-xs">
                Soumis le {format(new Date(submittedAt), 'PP', { locale: fr })}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {kycStatus === 'rejected' && (
        <Alert variant="destructive">
          <IconCircleX className="h-4 w-4" />
          <AlertTitle>Vérification refusée</AlertTitle>
          <AlertDescription>
            {(profile as any)?.kyc_rejection_reason
              ? `Motif : ${(profile as any).kyc_rejection_reason}. Veuillez corriger vos informations et soumettre à nouveau.`
              : 'Votre vérification a été refusée. Veuillez soumettre des informations correctes.'}
          </AlertDescription>
        </Alert>
      )}

      {kycStatus !== 'approved' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {kycStatus === 'rejected' ? 'Soumettre à nouveau' : 'Lancer la vérification'}
            </CardTitle>
            <CardDescription>
              Vos informations seront examinées manuellement par notre équipe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {kycStatus === 'pending' && (
              <p className="text-sm text-muted-foreground">
                Votre dossier est en cours d&apos;examen. Vous pouvez mettre à jour vos informations si nécessaire.
              </p>
            )}

            {/* Pays de résidence */}
            <div className="space-y-2">
              <Label htmlFor="accountCountry">Pays de résidence</Label>
              <Popover
                open={accountCountryOpen}
                onOpenChange={open => {
                  setAccountCountryOpen(open)
                  if (!open) setAccountCountrySearch('')
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    id="accountCountry"
                    aria-expanded={accountCountryOpen}
                    className={cn('w-full justify-between', fieldErrors.accountCountry && 'border-destructive')}
                  >
                    {accountCountry ? (
                      <span className="flex items-center gap-2">
                        <span>{countryOptions.find(c => c.code === accountCountry)?.flag}</span>
                        <span>{countryOptions.find(c => c.code === accountCountry)?.name || accountCountry}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Sélectionnez un pays</span>
                    )}
                    <IconChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="start" sideOffset={4} className="w-[--radix-popover-trigger-width] p-0">
                  <div className="flex items-center gap-2 border-b px-3 py-2">
                    <IconSearch className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un pays..."
                      value={accountCountrySearch}
                      onChange={e => setAccountCountrySearch(e.target.value)}
                      className="h-8 border-0 px-0 focus-visible:ring-0"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredConnectCountries.length > 0 ? (
                      filteredConnectCountries.map(country => (
                        <button
                          key={country.code}
                          type="button"
                          className={cn('flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-accent', accountCountry === country.code && 'bg-accent')}
                          onClick={() => { setAccountCountry(country.code); setAccountCountryOpen(false); setAccountCountrySearch(''); clearFieldError('accountCountry') }}
                        >
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{country.code}</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-muted-foreground">Aucun pays trouvé.</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {fieldErrors.accountCountry && <p className="text-xs text-destructive">{fieldErrors.accountCountry}</p>}
            </div>

            {/* Pays du document */}
            <div className="space-y-2">
              <Label htmlFor="documentCountry">Pays d&apos;émission du document</Label>
              <Popover
                open={documentCountryOpen}
                onOpenChange={open => {
                  setDocumentCountryOpen(open)
                  if (!open) setDocumentCountrySearch('')
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    id="documentCountry"
                    aria-expanded={documentCountryOpen}
                    className={cn('w-full justify-between', fieldErrors.documentCountry && 'border-destructive')}
                  >
                    {documentCountry ? (
                      <span className="flex items-center gap-2">
                        <span>{allCountryOptions.find(c => c.code === documentCountry)?.flag}</span>
                        <span>{allCountryOptions.find(c => c.code === documentCountry)?.name || documentCountry}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Sélectionnez un pays</span>
                    )}
                    <IconChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="start" sideOffset={4} className="w-[--radix-popover-trigger-width] p-0">
                  <div className="flex items-center gap-2 border-b px-3 py-2">
                    <IconSearch className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un pays..."
                      value={documentCountrySearch}
                      onChange={e => setDocumentCountrySearch(e.target.value)}
                      className="h-8 border-0 px-0 focus-visible:ring-0"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredDocumentCountries.length > 0 ? (
                      filteredDocumentCountries.map(country => (
                        <button
                          key={country.code}
                          type="button"
                          className={cn('flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-accent', documentCountry === country.code && 'bg-accent')}
                          onClick={() => { setDocumentCountry(country.code); setDocumentCountryOpen(false); setDocumentCountrySearch(''); clearFieldError('documentCountry') }}
                        >
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{country.code}</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-muted-foreground">Aucun pays trouvé.</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {fieldErrors.documentCountry && <p className="text-xs text-destructive">{fieldErrors.documentCountry}</p>}
            </div>

            {/* Type de document */}
            <div className="space-y-2">
              <Label htmlFor="documentType">Type de document</Label>
              <Select value={documentType} onValueChange={v => { setDocumentType(v as DocumentType); clearFieldError('documentType') }}>
                <SelectTrigger id="documentType" className={cn('w-full', fieldErrors.documentType && 'border-destructive')}>
                  <SelectValue placeholder="Sélectionnez un type de document" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passeport</SelectItem>
                  <SelectItem value="national_id">Carte d&apos;identité nationale</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.documentType && <p className="text-xs text-destructive">{fieldErrors.documentType}</p>}
            </div>

            {/* Informations personnelles */}
            <div className="space-y-4 rounded-lg border border-border/60 p-4">
              <p className="text-sm font-semibold">Informations personnelles</p>
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                <IconAlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-sm text-amber-800 dark:text-amber-200">
                  Utilisez vos noms exacts tels qu&apos;ils figurent sur votre document
                </AlertTitle>
                <AlertDescription className="text-xs text-amber-700 dark:text-amber-300">
                  Une discordance entraîne le rejet de la vérification.
                </AlertDescription>
              </Alert>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    autoComplete="given-name"
                    placeholder="Tous vos prénoms"
                    value={firstName}
                    onChange={e => { setFirstName(e.target.value); clearFieldError('firstName') }}
                    aria-invalid={Boolean(fieldErrors.firstName)}
                    className={cn(fieldErrors.firstName && 'border-destructive')}
                  />
                  {fieldErrors.firstName && <p className="text-xs text-destructive">{fieldErrors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    autoComplete="family-name"
                    placeholder="Nom de famille"
                    value={lastName}
                    onChange={e => { setLastName(e.target.value); clearFieldError('lastName') }}
                    aria-invalid={Boolean(fieldErrors.lastName)}
                    className={cn(fieldErrors.lastName && 'border-destructive')}
                  />
                  {fieldErrors.lastName && <p className="text-xs text-destructive">{fieldErrors.lastName}</p>}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); clearFieldError('email') }}
                    aria-invalid={Boolean(fieldErrors.email)}
                    className={cn(fieldErrors.email && 'border-destructive')}
                    disabled
                  />
                  {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="flex gap-2">
                    <Select value={dialCode} onValueChange={setDialCode}>
                      <SelectTrigger className="w-24 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+33">+33</SelectItem>
                        <SelectItem value="+32">+32</SelectItem>
                        <SelectItem value="+41">+41</SelectItem>
                        <SelectItem value="+44">+44</SelectItem>
                        <SelectItem value="+49">+49</SelectItem>
                        <SelectItem value="+229">+229</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex-1">
                      <Input
                        id="phone"
                        autoComplete="tel-local"
                        placeholder="6 12 34 56 78"
                        value={phone}
                        onChange={e => { setPhone(e.target.value); clearFieldError('phone') }}
                        aria-invalid={Boolean(fieldErrors.phone)}
                        className={cn(fieldErrors.phone && 'border-destructive')}
                      />
                    </div>
                  </div>
                  {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Date de naissance</Label>
                <Input
                  id="birthDate"
                  type="date"
                  autoComplete="bday"
                  value={birthDate}
                  onChange={e => { setBirthDate(e.target.value); clearFieldError('birthDate') }}
                  aria-invalid={Boolean(fieldErrors.birthDate)}
                  className={cn(fieldErrors.birthDate && 'border-destructive')}
                />
                {fieldErrors.birthDate && <p className="text-xs text-destructive">{fieldErrors.birthDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse <span className="text-muted-foreground font-normal">(facultatif)</span></Label>
                <Input
                  id="address"
                  autoComplete="street-address"
                  placeholder="Adresse"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville <span className="text-muted-foreground font-normal">(facultatif)</span></Label>
                  <Input
                    id="city"
                    autoComplete="address-level2"
                    placeholder="Ville"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Code postal <span className="text-muted-foreground font-normal">(facultatif)</span></Label>
                  <Input
                    id="postalCode"
                    autoComplete="postal-code"
                    placeholder="Code postal"
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Vos données sont traitées de façon sécurisée.{' '}
              <Link href="/cgv" className="underline hover:text-foreground">Voir nos CGU</Link>.
            </p>

            <div className="space-y-2">
              <div className={cn(
                'flex items-start gap-3 rounded-lg border border-border/60 px-4 py-3 text-sm',
                fieldErrors.confirmIdentity && 'border-destructive'
              )}>
                <Checkbox
                  id="confirmIdentity"
                  checked={confirmIdentity}
                  onCheckedChange={v => { setConfirmIdentity(Boolean(v)); clearFieldError('confirmIdentity') }}
                />
                <Label htmlFor="confirmIdentity" className="cursor-pointer text-sm font-normal leading-5">
                  J&apos;accepte les{' '}
                  <Link href="/cgv" className="underline hover:text-foreground" onClick={e => e.stopPropagation()}>
                    Conditions Générales d&apos;Utilisation
                  </Link>{' '}
                  et confirme que les informations sont exactes.
                </Label>
              </div>
              {fieldErrors.confirmIdentity && <p className="text-xs text-destructive">{fieldErrors.confirmIdentity}</p>}
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Soumettre pour vérification'
              )}
            </Button>

            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
