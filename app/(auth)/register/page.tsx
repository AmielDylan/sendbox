/**
 * Page d'inscription
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from "@/lib/core/auth/validations"
import { signUp } from "@/lib/core/auth/actions"
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
import { Loader2, Package } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      terms: false,
    },
  })

  const password = watch('password')

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
    } catch (error) {
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
            <Package className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
          <CardDescription>
            Rejoignez Sendbox pour commencer à envoyer et recevoir des colis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            {/* Bouton submit */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                'Créer mon compte'
              )}
            </Button>

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
