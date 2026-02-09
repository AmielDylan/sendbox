/**
 * Page d'inscription
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@/lib/core/auth/validations'
import { signUp } from '@/lib/core/auth/actions'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { IconLoader2, IconPackage } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

const PASSWORD_CHECKS = [
  {
    key: 'length',
    label: '12+ caractères',
    test: (v: string) => v.length >= 12,
  },
  { key: 'lower', label: '1 minuscule', test: (v: string) => /[a-z]/.test(v) },
  { key: 'upper', label: '1 majuscule', test: (v: string) => /[A-Z]/.test(v) },
  { key: 'number', label: '1 chiffre', test: (v: string) => /\d/.test(v) },
  {
    key: 'special',
    label: '1 caractère spécial',
    test: (v: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(v),
  },
]

function RegisterForm() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [authCheckComplete, setAuthCheckComplete] = useState(false)

  // Tous les hooks doivent être définis avant toute condition de rendu
  const {
    register,
    handleSubmit,
    control,
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
      <div className="w-full">
        <Card className="border-2 border-border/50 shadow-xl shadow-primary/5 backdrop-blur-sm bg-background/95 rounded-2xl">
          <CardHeader className="space-y-4 py-12 text-center">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <IconPackage className="h-7 w-7 text-primary animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-2xl">Vérification...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    try {
      const result = await signUp(data)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success(result.message)
        router.push('/verify-email')
      }
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <Card className="border-2 border-border/50 shadow-xl shadow-primary/5 backdrop-blur-sm bg-background/95 rounded-2xl overflow-hidden">
        <CardHeader className="space-y-4 pb-8 text-center">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <IconPackage className="h-7 w-7 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">
              Créer un compte
            </CardTitle>
            <CardDescription className="text-base">
              Rejoignez la communauté Sendbox
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                    className={cn(
                      'h-2 rounded-full transition-all',
                      passwordBarClass
                    )}
                    style={{
                      width: `${(passwordScore / PASSWORD_CHECKS.length) * 100}%`,
                    }}
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
                        <span aria-hidden="true">{isValid ? '✓' : '•'}</span>
                        {check.label}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Confirmation mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••••••"
                {...register('confirmPassword')}
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                aria-describedby={
                  errors.confirmPassword ? 'confirmPassword-error' : undefined
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
            <div className="flex items-center space-x-2">
              <Controller
                name="terms"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="terms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-invalid={errors.terms ? 'true' : 'false'}
                    aria-describedby={errors.terms ? 'terms-error' : undefined}
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inscription en cours...
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Certaines actions (publication, paiement, envoi/réception,
                assurance) nécessitent une vérification d&apos;identité.
              </p>
            </div>

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
