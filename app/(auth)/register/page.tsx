'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
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
import { IconLoader2 } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

const PASSWORD_CHECKS = [
  { key: 'length', label: '12+ caractères', test: (v: string) => v.length >= 12 },
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

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { terms: false },
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

  useEffect(() => {
    if (!loading) {
      setAuthCheckComplete(true)
      if (user) router.push('/dashboard')
    }
    const timeout = setTimeout(() => setAuthCheckComplete(true), 3000)
    return () => clearTimeout(timeout)
  }, [user, loading, router])

  if (!authCheckComplete) {
    return (
      <div className="w-full">
        <Card className="border shadow-sm rounded-2xl">
          <CardHeader className="space-y-4 py-10 text-center">
            <div className="flex justify-center">
              <Image src="/images/branding/logo.svg" alt="Sendbox" width={100} height={20} className="dark:hidden" />
              <Image src="/images/branding/logo-white.svg" alt="Sendbox" width={100} height={20} className="hidden dark:block" />
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
      <Card className="border shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="space-y-3 pb-4 text-center">
          <div className="flex justify-center pt-2">
            <Image src="/images/branding/logo.svg" alt="Sendbox" width={100} height={20} className="dark:hidden" />
            <Image src="/images/branding/logo-white.svg" alt="Sendbox" width={100} height={20} className="hidden dark:block" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
            <CardDescription>Rejoignez la communauté Sendbox</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstname">Prénom</Label>
                <Input
                  id="firstname"
                  type="text"
                  placeholder="Jean"
                  {...register('firstname')}
                  aria-invalid={errors.firstname ? 'true' : 'false'}
                />
                {errors.firstname && (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.firstname.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastname">Nom</Label>
                <Input
                  id="lastname"
                  type="text"
                  placeholder="Dupont"
                  {...register('lastname')}
                  aria-invalid={errors.lastname ? 'true' : 'false'}
                />
                {errors.lastname && (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.lastname.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jean.dupont@example.com"
                {...register('email')}
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  {...register('password')}
                  aria-invalid={errors.password ? 'true' : 'false'}
                />
                {errors.password && (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.password.message}
                  </p>
                )}
                {passwordValue.length > 0 && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className={cn('h-1.5 rounded-full transition-all', passwordBarClass)}
                        style={{ width: `${(passwordScore / PASSWORD_CHECKS.length) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Force : <span className="font-medium">{passwordLabel}</span>
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmer</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••••••"
                  {...register('confirmPassword')}
                  aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* Critères non encore remplis uniquement */}
            {passwordValue.length > 0 && passwordScore < PASSWORD_CHECKS.length && (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {PASSWORD_CHECKS.filter(check => !check.test(passwordValue)).map(check => (
                  <span key={check.key} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span aria-hidden="true">·</span>
                    {check.label}
                  </span>
                ))}
              </div>
            )}

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
                  />
                )}
              />
              <div className="leading-none">
                <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                  J&apos;accepte les{' '}
                  <Link href="/terms" className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
                    conditions générales
                  </Link>
                </Label>
                {errors.terms && (
                  <p className="text-xs text-destructive mt-0.5" role="alert">
                    {errors.terms.message}
                  </p>
                )}
              </div>
            </div>

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

            <p className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-primary underline hover:no-underline">
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
