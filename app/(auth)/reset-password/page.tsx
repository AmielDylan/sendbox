/**
 * Page de réinitialisation de mot de passe
 */

'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  resetPasswordRequestSchema,
  resetPasswordSchema,
  type ResetPasswordRequestInput,
  type ResetPasswordInput,
} from '@/lib/core/auth/validations'
import { requestPasswordReset, resetPassword } from '@/lib/core/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { IconLoader2 } from '@tabler/icons-react'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const updateMode = searchParams.get('update') === 'true'
  const [isRequestSent, setIsRequestSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Formulaire de demande de réinitialisation
  const requestForm = useForm<ResetPasswordRequestInput>({
    resolver: zodResolver(resetPasswordRequestSchema),
  })

  // Formulaire de réinitialisation avec token
  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onRequestSubmit = async (data: ResetPasswordRequestInput) => {
    setIsLoading(true)
    try {
      const result = await requestPasswordReset(data)
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.success) {
        setIsRequestSent(true)
        toast.success(result.message)
      }
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const onResetSubmit = async (data: ResetPasswordInput) => {
    if (!token && !updateMode) {
      toast.error('Token manquant. Veuillez utiliser le lien reçu par email.')
      return
    }

    setIsLoading(true)
    try {
      const result = await resetPassword({ ...data, token: token ?? '' })
      if (result?.error) {
        toast.error(result.error)
        return
      }
      // Redirection gérée par la Server Action
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  // Token présent (ancien flux) OU mode update (depuis callback recovery)
  if (token || updateMode) {
    return (
      <div className="w-full">
        <Card className="border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="space-y-3 pb-4 text-center">
            <div className="flex justify-center pt-2">
              <Image
                src="/images/branding/logo.svg"
                alt="Sendbox"
                width={100}
                height={20}
                className="dark:hidden"
              />
              <Image
                src="/images/branding/logo-white.svg"
                alt="Sendbox"
                width={100}
                height={20}
                className="hidden dark:block"
              />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                Nouveau mot de passe
              </CardTitle>
              <CardDescription>
                Entrez votre nouveau mot de passe
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={resetForm.handleSubmit(onResetSubmit)}
              className="space-y-4"
            >
              {/* Nouveau mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  {...resetForm.register('password')}
                  aria-invalid={
                    resetForm.formState.errors.password ? 'true' : 'false'
                  }
                  aria-describedby={
                    resetForm.formState.errors.password
                      ? 'password-error'
                      : undefined
                  }
                />
                {resetForm.formState.errors.password && (
                  <p
                    id="password-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {resetForm.formState.errors.password.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Minimum 12 caractères avec majuscule, minuscule, chiffre et
                  caractère spécial
                </p>
              </div>

              {/* Confirmation */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmer le mot de passe
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  {...resetForm.register('confirmPassword')}
                  aria-invalid={
                    resetForm.formState.errors.confirmPassword
                      ? 'true'
                      : 'false'
                  }
                  aria-describedby={
                    resetForm.formState.errors.confirmPassword
                      ? 'confirmPassword-error'
                      : undefined
                  }
                />
                {resetForm.formState.errors.confirmPassword && (
                  <p
                    id="confirmPassword-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {resetForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Bouton submit */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Réinitialisation en cours...
                  </>
                ) : (
                  'Réinitialiser le mot de passe'
                )}
              </Button>

              {/* Lien connexion */}
              <p className="text-center text-sm text-muted-foreground">
                <Link
                  href="/login"
                  className="text-primary underline hover:no-underline"
                >
                  Retour à la connexion
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Formulaire de demande de réinitialisation
  if (isRequestSent) {
    return (
      <div className="w-full">
        <Card className="border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="space-y-3 pb-4 text-center">
            <div className="flex justify-center pt-2">
              <Image
                src="/images/branding/logo.svg"
                alt="Sendbox"
                width={100}
                height={20}
                className="dark:hidden"
              />
              <Image
                src="/images/branding/logo-white.svg"
                alt="Sendbox"
                width={100}
                height={20}
                className="hidden dark:block"
              />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                Email envoyé !
              </CardTitle>
              <CardDescription>
                Si cet email existe dans notre système, vous recevrez un lien de
                réinitialisation dans quelques instants.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-6 sm:px-8 pb-6 space-y-4">
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              className="w-full"
            >
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Card className="border shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="space-y-3 pb-4 text-center">
          <div className="flex justify-center pt-2">
            <Image
              src="/images/branding/logo.svg"
              alt="Sendbox"
              width={100}
              height={20}
              className="dark:hidden"
            />
            <Image
              src="/images/branding/logo-white.svg"
              alt="Sendbox"
              width={100}
              height={20}
              className="hidden dark:block"
            />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              Mot de passe oublié ?
            </CardTitle>
            <CardDescription>
              Entrez votre email pour recevoir un lien de réinitialisation
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-6">
          <form
            onSubmit={requestForm.handleSubmit(onRequestSubmit)}
            className="space-y-4"
          >
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jean.dupont@example.com"
                autoComplete="email"
                {...requestForm.register('email')}
                aria-invalid={
                  requestForm.formState.errors.email ? 'true' : 'false'
                }
                aria-describedby={
                  requestForm.formState.errors.email ? 'email-error' : undefined
                }
              />
              {requestForm.formState.errors.email && (
                <p
                  id="email-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {requestForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Bouton submit */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Envoyer le lien de réinitialisation'
              )}
            </Button>

            {/* Lien connexion */}
            <p className="text-center text-sm text-muted-foreground">
              Vous vous souvenez de votre mot de passe ?{' '}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full border shadow-sm rounded-2xl">
          <CardHeader className="space-y-4 py-10 text-center">
            <div className="flex justify-center">
              <Image
                src="/images/branding/logo.svg"
                alt="Sendbox"
                width={100}
                height={20}
                className="dark:hidden"
              />
              <Image
                src="/images/branding/logo-white.svg"
                alt="Sendbox"
                width={100}
                height={20}
                className="hidden dark:block"
              />
            </div>
            <CardTitle className="text-2xl">Chargement...</CardTitle>
          </CardHeader>
        </Card>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
