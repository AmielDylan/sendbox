/**
 * Page de vérification d'email
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { verifyEmail } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Package, CheckCircle2, XCircle } from 'lucide-react'

function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  )
  const token = searchParams.get('token')

  useEffect(() => {
    const verify = async () => {
      try {
        const result = await verifyEmail(token || undefined)
        if (result?.error) {
          setStatus('error')
          toast.error(result.error)
        } else {
          setStatus('success')
          toast.success('Email vérifié avec succès !')
          // Redirection gérée par la Server Action
        }
      } catch (error) {
        setStatus('error')
        toast.error('Une erreur est survenue lors de la vérification.')
      }
    }

    verify()
  }, [token])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Vérification en cours...
            </CardTitle>
            <CardDescription>
              Veuillez patienter pendant la vérification de votre email
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Email vérifié !
            </CardTitle>
            <CardDescription>
              Votre compte a été vérifié avec succès. Vous allez être redirigé
              vers votre tableau de bord.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Accéder au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Vérification échouée
          </CardTitle>
          <CardDescription>
            Le lien de vérification est invalide ou a expiré. Veuillez demander
            un nouveau lien.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => router.push('/auth/login')}
            variant="outline"
            className="w-full"
          >
            Retour à la connexion
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Besoin d&apos;aide ?{' '}
            <Link
              href="/support"
              className="text-primary underline hover:no-underline"
            >
              Contactez le support
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Chargement...
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  )
}
