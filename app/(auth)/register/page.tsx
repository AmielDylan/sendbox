/**
 * Page d'inscription
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from "@/lib/core/auth/validations"
import { signUp } from "@/lib/core/auth/actions"
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
import { toast } from 'sonner'
import {
  IconLoader2,
  IconPackage,
  IconChevronDown,
  IconSearch,
  IconShieldLock,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { getStripeClient } from '@/lib/shared/services/stripe/config'
import { COUNTRY_OPTIONS, getCountryFlagEmoji } from '@/lib/utils/countries'

const PHONE_COUNTRIES = [
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'BJ', name: 'Bénin', dialCode: '+229' },
  { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225' },
  { code: 'SN', name: 'Sénégal', dialCode: '+221' },
  { code: 'TG', name: 'Togo', dialCode: '+228' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226' },
  { code: 'ML', name: 'Mali', dialCode: '+223' },
  { code: 'NE', name: 'Niger', dialCode: '+227' },
  { code: 'GN', name: 'Guinée', dialCode: '+224' },
  { code: 'CM', name: 'Cameroun', dialCode: '+237' },
  { code: 'CD', name: 'Rép. Dém. du Congo', dialCode: '+243' },
  { code: 'CG', name: 'Congo', dialCode: '+242' },
  { code: 'GA', name: 'Gabon', dialCode: '+241' },
  { code: 'MA', name: 'Maroc', dialCode: '+212' },
  { code: 'DZ', name: 'Algérie', dialCode: '+213' },
  { code: 'TN', name: 'Tunisie', dialCode: '+216' },
  { code: 'BE', name: 'Belgique', dialCode: '+32' },
  { code: 'CH', name: 'Suisse', dialCode: '+41' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'LU', name: 'Luxembourg', dialCode: '+352' },
  { code: 'MC', name: 'Monaco', dialCode: '+377' },
].map(country => ({
  ...country,
  flag: getCountryFlagEmoji(country.code),
}))

const PASSWORD_CHECKS = [
  { key: 'length', label: '12+ caractères', test: (v: string) => v.length >= 12 },
  { key: 'lower', label: '1 minuscule', test: (v: string) => /[a-z]/.test(v) },
  { key: 'upper', label: '1 majuscule', test: (v: string) => /[A-Z]/.test(v) },
  { key: 'number', label: '1 chiffre', test: (v: string) => /\d/.test(v) },
  { key: 'special', label: '1 caractère spécial', test: (v: string) => /[@$!%*?&]/.test(v) },
]

function RegisterForm() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifyingIdentity, setIsVerifyingIdentity] = useState(false)
  const [authCheckComplete, setAuthCheckComplete] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [phoneCountry, setPhoneCountry] = useState(PHONE_COUNTRIES[0])
  const [phoneDigits, setPhoneDigits] = useState('')
  const [countryOpen, setCountryOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')

  // Tous les hooks doivent être définis avant toute condition de rendu
  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      terms: false,
    },
  })

  const passwordValue = useWatch({ control, name: 'password' }) || ''
  const passwordScore = useMemo(
    () => PASSWORD_CHECKS.filter(check => check.test(passwordValue)).length,
    [passwordValue]
  )
  const passwordLabel =
    passwordScore <= 2 ? 'Faible' : passwordScore <= 4 ? 'Moyen' : 'Fort'
  const passwordBarClass =
    passwordScore <= 2
      ? 'bg-destructive'
      : passwordScore <= 4
        ? 'bg-amber-500'
        : 'bg-emerald-500'

  const watchedPhone = useWatch({ control, name: 'phone' }) || ''

  useEffect(() => {
    if (!watchedPhone) {
      return
    }
    const matchedCountry = PHONE_COUNTRIES.find(country =>
      watchedPhone.startsWith(country.dialCode)
    )
    if (matchedCountry && matchedCountry.code !== phoneCountry.code) {
      setPhoneCountry(matchedCountry)
    }
    const digitsOnly = watchedPhone
      .replace(matchedCountry?.dialCode || '', '')
      .replace(/\D/g, '')
    if (digitsOnly && digitsOnly !== phoneDigits) {
      setPhoneDigits(digitsOnly)
    }
  }, [watchedPhone, phoneCountry.code, phoneDigits])

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase()
    if (!query) {
      return COUNTRY_OPTIONS
    }
    return COUNTRY_OPTIONS.filter(country =>
      country.name.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query)
    )
  }, [countrySearch])

  const stripePromise = useMemo(() => getStripeClient(), [])

  // Vérification d'authentification avec timeout
  useEffect(() => {
    if (!loading) {
      // Auth check is complete
      setAuthCheckComplete(true)
      if (user) {
        router.push('/dashboard')
      }
    }

    // Timeout de sécurité côté client (3 secondes)
    const timeout = setTimeout(() => {
      setAuthCheckComplete(true)
    }, 3000)

    return () => clearTimeout(timeout)
  }, [user, loading, router])

  // Afficher un indicateur de chargement pendant la vérification d'authentification
  if (!authCheckComplete) {
    return (
      <div className="w-full max-w-xl">
        <Card className="border-border/70 shadow-sm rounded-md">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <IconPackage className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-2xl">
              Vérification de la connexion...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const goToIdentityStep = async () => {
    const isValid = await trigger([
      'firstname',
      'lastname',
      'email',
      'phone',
      'password',
      'confirmPassword',
      'terms',
    ])
    if (isValid) {
      setStep(2)
    }
  }

  const onSubmit = async (data: RegisterInput) => {
    if (step === 1) {
      await goToIdentityStep()
      return
    }
    setIsLoading(true)
    setIsVerifyingIdentity(false)
    try {
      const result = await signUp(data)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        if (result.identityError) {
          toast.error(result.identityError)
        }

        if (result.verificationClientSecret) {
          const stripe = await stripePromise
          if (!stripe) {
            toast.error("Stripe n'est pas encore disponible. Réessayez.")
          } else {
            setIsVerifyingIdentity(true)
            const { error } = await stripe.verifyIdentity(
              result.verificationClientSecret
            )

            if (error) {
              toast.error(
                error.message ||
                  "La vérification d'identité n'a pas pu être complétée."
              )
            } else {
              toast.success('Vérification envoyée avec succès.')
            }
          }
        }

        toast.success(result.message)
        router.push('/verify-email')
      }
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
      setIsVerifyingIdentity(false)
    }
  }

  return (
    <div className="w-full max-w-xl">
      <Card className="border-border/70 shadow-sm rounded-md">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <IconPackage className="h-10 w-10 text-primary" />
          </div>
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold',
                step === 1
                  ? 'border-primary text-primary'
                  : 'border-muted-foreground/40 text-muted-foreground'
              )}
            >
              1
            </div>
            <span>Compte</span>
            <div className="h-px w-8 bg-border" />
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold',
                step === 2
                  ? 'border-primary text-primary'
                  : 'border-muted-foreground/40 text-muted-foreground'
              )}
            >
              2
            </div>
            <span>Identité</span>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl">
              {step === 1 ? 'Créer un compte' : "Vérification d'identité"}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? 'Rejoignez Sendbox pour commencer à envoyer et recevoir des colis'
                : "Vérifiez votre identité pour sécuriser votre compte"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 ? (
              <>
                {/* Prénom et Nom */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstname">Prénom</Label>
                    <Input
                      id="firstname"
                      type="text"
                      placeholder="Jean"
                      {...register('firstname')}
                      aria-invalid={errors.firstname ? 'true' : 'false'}
                      aria-describedby={
                        errors.firstname ? 'firstname-error' : undefined
                      }
                    />
                    {errors.firstname && (
                      <p
                        id="firstname-error"
                        className="text-sm text-destructive"
                        role="alert"
                      >
                        {errors.firstname.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastname">Nom</Label>
                    <Input
                      id="lastname"
                      type="text"
                      placeholder="Dupont"
                      {...register('lastname')}
                      aria-invalid={errors.lastname ? 'true' : 'false'}
                      aria-describedby={
                        errors.lastname ? 'lastname-error' : undefined
                      }
                    />
                    {errors.lastname && (
                      <p
                        id="lastname-error"
                        className="text-sm text-destructive"
                        role="alert"
                      >
                        {errors.lastname.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jean.dupont@example.com"
                    {...register('email')}
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <p
                      id="email-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Téléphone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Select
                          value={phoneCountry.code}
                          onValueChange={(value) => {
                            const selected = PHONE_COUNTRIES.find(
                              country => country.code === value
                            )
                            if (!selected) return
                            setPhoneCountry(selected)
                            const nextValue = phoneDigits
                              ? `${selected.dialCode}${phoneDigits}`
                              : ''
                            field.onChange(nextValue)
                          }}
                        >
                          <SelectTrigger className="sm:w-[200px]">
                            <SelectValue placeholder="Indicatif" />
                          </SelectTrigger>
                          <SelectContent side="bottom">
                            {PHONE_COUNTRIES.map(country => (
                              <SelectItem key={country.code} value={country.code}>
                                <span className="mr-2">{country.flag}</span>
                                <span className="mr-2">{country.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {country.dialCode}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id="phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          placeholder="612345678"
                          value={phoneDigits}
                          onChange={(event) => {
                            const digits = event.target.value.replace(/\D/g, '')
                            setPhoneDigits(digits)
                            const nextValue = digits
                              ? `${phoneCountry.dialCode}${digits}`
                              : ''
                            field.onChange(nextValue)
                          }}
                          aria-invalid={errors.phone ? 'true' : 'false'}
                          aria-describedby={
                            errors.phone ? 'phone-error' : undefined
                          }
                        />
                      </div>
                    )}
                  />
                  {errors.phone && (
                    <p
                      id="phone-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.phone.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Choisissez l&apos;indicatif puis entrez le numéro
                    (chiffres uniquement).
                  </p>
                </div>

                {/* Mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    {...register('password')}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={
                      errors.password ? 'password-error' : undefined
                    }
                  />
                  {errors.password && (
                    <p
                      id="password-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.password.message}
                    </p>
                  )}
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={cn('h-2 rounded-full transition-all', passwordBarClass)}
                        style={{ width: `${(passwordScore / PASSWORD_CHECKS.length) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Force : <span className="font-medium">{passwordLabel}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {PASSWORD_CHECKS.map(check => {
                        const isValid = check.test(passwordValue)
                        return (
                          <span
                            key={check.key}
                            className={cn(
                              'flex items-center gap-1',
                              isValid ? 'text-emerald-600' : 'text-muted-foreground'
                            )}
                          >
                            <span aria-hidden="true">
                              {isValid ? '✓' : '•'}
                            </span>
                            {check.label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Confirmation mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirmer le mot de passe
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••••••"
                    {...register('confirmPassword')}
                    aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                    aria-describedby={
                      errors.confirmPassword
                        ? 'confirmPassword-error'
                        : undefined
                    }
                  />
                  {errors.confirmPassword && (
                    <p
                      id="confirmPassword-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* CGU */}
                <div className="flex items-start space-x-2">
                  <Controller
                    name="terms"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="terms"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-invalid={errors.terms ? 'true' : 'false'}
                        aria-describedby={
                          errors.terms ? 'terms-error' : undefined
                        }
                      />
                    )}
                  />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor="terms"
                      className="text-sm font-normal cursor-pointer"
                    >
                      J&apos;accepte les{' '}
                      <Link
                        href="/terms"
                        className="text-primary underline hover:no-underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        conditions générales d&apos;utilisation
                      </Link>
                    </Label>
                    {errors.terms && (
                      <p
                        id="terms-error"
                        className="text-sm text-destructive"
                        role="alert"
                      >
                        {errors.terms.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button type="button" className="w-full" onClick={goToIdentityStep}>
                    Continuer vers la vérification d&apos;identité
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Étape suivante : sélection du document et vérification via
                    Stripe Identity.
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Type de document */}
                <div className="space-y-2">
                  <Label htmlFor="documentType">Type de document</Label>
                  <Controller
                    name="documentType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
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
                    )}
                  />
                  {errors.documentType && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.documentType.message}
                    </p>
                  )}
                </div>

                {/* Pays d'émission */}
                <div className="space-y-2">
                  <Label htmlFor="documentCountry">
                    Pays d&apos;émission du document
                  </Label>
                  <Controller
                    name="documentCountry"
                    control={control}
                    render={({ field }) => (
                      <Popover
                        open={countryOpen}
                        onOpenChange={(open) => {
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
                            {field.value ? (
                              <span className="flex items-center gap-2">
                                <span>
                                  {
                                    COUNTRY_OPTIONS.find(
                                      country => country.code === field.value
                                    )?.flag
                                  }
                                </span>
                                <span>
                                  {
                                    COUNTRY_OPTIONS.find(
                                      country => country.code === field.value
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
                              onChange={(event) =>
                                setCountrySearch(event.target.value)
                              }
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
                                    field.value === country.code && 'bg-accent'
                                  )}
                                  onClick={() => {
                                    field.onChange(country.code)
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
                    )}
                  />
                  {errors.documentCountry && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.documentCountry.message}
                    </p>
                  )}
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

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => setStep(1)}
                  >
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || isVerifyingIdentity}
                  >
                    {isVerifyingIdentity ? (
                      <>
                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ouverture de Stripe Identity...
                      </>
                    ) : isLoading ? (
                      <>
                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                        Inscription en cours...
                      </>
                    ) : (
                      'Créer mon compte & vérifier mon identité'
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Lien connexion */}
            <p className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{' '}
              <Link
                href="/login"
                className="text-primary underline hover:no-underline"
              >
                Se connecter
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return <RegisterForm />
}
