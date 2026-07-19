'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/core/auth/validations'
import { signIn } from '@/lib/core/auth/actions'
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
  }, [searchParams])

  if (!authCheckComplete) {
    return (
      <div className="w-full">
        <Card className="border shadow-sm rounded-2xl">
          <CardHeader className="space-y-4 py-12 text-center">
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
            <CardTitle className="text-2xl font-bold">Se connecter</CardTitle>
            <CardDescription>Accédez à votre espace Sendbox</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
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

            <div className="space-y-1.5">
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
        <Card className="w-full border shadow-sm rounded-2xl">
          <CardHeader className="space-y-4 py-12 text-center">
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
      <LoginForm />
    </Suspense>
  )
}
