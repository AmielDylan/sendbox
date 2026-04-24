'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/core/auth/validations'
import { signIn } from '@/lib/core/auth/actions'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/shared/db/client'
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
import Image from 'next/image'
import { IconLoader2 } from '@tabler/icons-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading, refetch } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [authCheckComplete, setAuthCheckComplete] = useState(false)

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

  useEffect(() => {
    if (!loading) {
      setAuthCheckComplete(true)
      if (user) {
        router.replace('/dashboard')
      }
    }

    const timeout = setTimeout(() => {
      setAuthCheckComplete(true)
    }, 800)

    return () => clearTimeout(timeout)
  }, [user, loading, router])

  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'password-reset-success') {
      toast.success('Mot de passe réinitialisé avec succès !')
    }

    const error = searchParams.get('error')
    if (error === 'no_linked_account') {
      toast.error(
        'Aucun compte Sendbox lié à cette identité. Veuillez créer un compte ou connectez-vous par email puis liez votre compte dans les paramètres.'
      )
    }
  }, [searchParams])

  const handleOAuth = async (provider: 'google' | 'facebook' | 'apple') => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?oauth=true`,
      },
    })
    if (error) toast.error('Erreur lors de la connexion. Veuillez réessayer.')
  }

  if (!authCheckComplete) {
    return (
      <div className="w-full">
        <Card className="border shadow-sm rounded-2xl">
          <CardHeader className="space-y-4 py-12 text-center">
            <div className="flex justify-center">
              <Image src="/images/branding/logo.svg" alt="Sendbox" width={130} height={26} className="dark:hidden" />
              <Image src="/images/branding/logo-white.svg" alt="Sendbox" width={130} height={26} className="hidden dark:block" />
            </div>
            <CardTitle className="text-2xl">Vérification...</CardTitle>
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
          router.push('/verify-email')
        }
        return
      }

      if (result?.success) {
        const redirectUrl = result.redirectTo || '/dashboard'
        await new Promise(resolve => setTimeout(resolve, 300))
        await refetch()
        router.replace(redirectUrl)
      }
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <Card className="border shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="space-y-4 pb-6 text-center">
          <div className="flex justify-center pt-2">
            <Image src="/images/branding/logo.svg" alt="Sendbox" width={130} height={26} className="dark:hidden" />
            <Image src="/images/branding/logo-white.svg" alt="Sendbox" width={130} height={26} className="hidden dark:block" />
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
                <p id="email-error" className="text-sm text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

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
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

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
              <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                Se souvenir de moi
              </Label>
            </div>

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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continuer avec
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => handleOAuth('google')}
                aria-label="Connexion avec Google"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => handleOAuth('facebook')}
                aria-label="Connexion avec Facebook"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => handleOAuth('apple')}
                aria-label="Connexion avec Apple"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                </svg>
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-primary underline hover:no-underline">
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
        <Card className="w-full border shadow-sm rounded-2xl">
          <CardHeader className="space-y-4 py-12 text-center">
            <div className="flex justify-center">
              <Image src="/images/branding/logo.svg" alt="Sendbox" width={130} height={26} className="dark:hidden" />
              <Image src="/images/branding/logo-white.svg" alt="Sendbox" width={130} height={26} className="hidden dark:block" />
            </div>
            <CardTitle className="text-2xl">Chargement...</CardTitle>
          </CardHeader>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
