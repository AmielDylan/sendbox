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
  const { user, loading, refetch } = useAuth()
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
      <div className="w-full">
        <Card className="border-2 border-border/50 shadow-xl shadow-primary/5 backdrop-blur-sm bg-background/95 rounded-2xl">
          <CardHeader className="space-y-4 py-12 text-center">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <IconPackage className="h-7 w-7 text-primary animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              Vérification...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    try {
      console.log('[Login] Attempting sign in...')
      const result = await signIn(data)
      console.log('[Login] Sign in result:', result)

      if (result?.error) {
        console.error('[Login] Sign in error:', result.error)
        toast.error(result.error)
        if (result.requiresVerification) {
          // Rediriger vers la page de vérification
          router.push('/verify-email')
        }
        return
      }

      // Si succès, rediriger immédiatement
      // Le AuthProvider va gérer la mise à jour de la session via onAuthStateChange
      if (result?.success) {
        console.log('[Login] Sign in successful, redirecting...')
        const redirectUrl = result.redirectTo || '/dashboard'

        // Petit délai pour laisser Supabase persister la session
        await new Promise(resolve => setTimeout(resolve, 300))

        // Synchroniser le store côté client après un login serveur
        await refetch()

        // Utiliser replace pour éviter de garder /login dans l'historique
        router.replace(redirectUrl)
      }
    } catch (error) {
      console.error('[Login] Unexpected error:', error)
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
            <CardTitle className="text-3xl font-bold">Connexion</CardTitle>
            <CardDescription className="text-base">
              Accédez à votre espace Sendbox
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
        <Card className="w-full border-2 border-border/50 shadow-xl shadow-primary/5 backdrop-blur-sm bg-background/95 rounded-2xl">
          <CardHeader className="space-y-4 py-12 text-center">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <IconPackage className="h-7 w-7 text-primary animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              Chargement...
            </CardTitle>
          </CardHeader>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
