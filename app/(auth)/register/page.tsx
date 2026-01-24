/**
 * Page d'inscription
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from "@/lib/core/auth/validations"
import { signUp } from "@/lib/core/auth/actions"
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import { toast } from 'sonner'
import { IconLoader2, IconPackage, IconShieldLock } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { getStripeClient } from '@/lib/shared/services/stripe/config'
import { COUNTRY_OPTIONS } from '@/lib/utils/countries'

function RegisterForm() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifyingIdentity, setIsVerifyingIdentity] = useState(false)
  const [authCheckComplete, setAuthCheckComplete] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)

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
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+33123456789"
                    {...register('phone')}
                    aria-invalid={errors.phone ? 'true' : 'false'}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
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
                    Format : +33XXXXXXXXX ou +229XXXXXXXXX
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
                  <p className="text-xs text-muted-foreground">
                    Minimum 12 caractères avec majuscule, minuscule, chiffre et
                    caractère spécial
                  </p>
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
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="documentCountry">
                          <SelectValue placeholder="Sélectionnez un pays" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRY_OPTIONS.map(country => (
                            <SelectItem
                              key={country.code}
                              value={country.code}
                            >
                              <span className="mr-2">{country.flag}</span>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
