/**
 * Page de connexion
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from "@/lib/core/auth/validations"
import { signIn } from "@/lib/core/auth/actions"
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

function LoginForm() {
  const searchParams = useSearchParams()
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
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  // Vérification d'authentification avec timeout réduit
  useEffect(() => {
    if (!loading) {
      // Auth check is complete
      setAuthCheckComplete(true)
      if (user) {
        // Utiliser replace au lieu de push pour ne pas ajouter à l'historique
        router.replace('/dashboard')
      }
    }

    // Timeout de sécurité côté client réduit à 800ms
    const timeout = setTimeout(() => {
      setAuthCheckComplete(true)
    }, 800)

    return () => clearTimeout(timeout)
  }, [user, loading, router])

  // Afficher un message si présent dans l'URL
  const message = searchParams.get('message')
  useEffect(() => {
    if (message === 'password-reset-success') {
      toast.success('Mot de passe réinitialisé avec succès !')
    }
  }, [message])

  // Afficher un indicateur de chargement pendant la vérification d'authentification
  if (!authCheckComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <IconPackage className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Vérification de la connexion...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    try {
      const result = await signIn(data)

      if (result?.error) {
        toast.error(result.error)
        if (result.requiresVerification) {
          // Rediriger vers la page de vérification
          router.push('/verify-email')
        }
        return
      }

      // Si succès, attendre que la session soit mise à jour avant de rediriger
      if (result?.success) {
        // Attendre un peu pour que Supabase mette à jour la session
        await new Promise(resolve => setTimeout(resolve, 500))

        // Déclencher un événement personnalisé pour forcer la mise à jour des données
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth-change'))
        }

        // Rediriger vers le dashboard
        const redirectUrl = result.redirectTo || '/dashboard'
        router.push(redirectUrl)

        // Forcer le refresh après la redirection
        setTimeout(() => {
          router.refresh()
        }, 100)
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <IconPackage className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
          <CardDescription>
            Connectez-vous à votre compte Sendbox
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jean.dupont@example.com"
                autoComplete="email"
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link
                  href="/reset-password"
                  className="text-sm text-primary underline hover:no-underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
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
            </div>

            {/* Se souvenir de moi */}
            <div className="flex items-center space-x-2">
              <Controller
                name="rememberMe"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="rememberMe"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-normal cursor-pointer"
              >
                Se souvenir de moi
              </Label>
            </div>

            {/* Bouton submit */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>

            {/* Lien inscription */}
            <p className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{' '}
              <Link
                href="/register"
                className="text-primary underline hover:no-underline"
              >
                Créer un compte
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <IconPackage className="h-12 w-12 text-primary animate-pulse" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Chargement...
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
