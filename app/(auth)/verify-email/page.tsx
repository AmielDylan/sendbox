/**
 * Page de vérification d'email
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { verifyEmail } from "@/lib/core/auth/actions"
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { IconLoader2, IconPackage, IconCheck, IconX } from '@tabler/icons-react'

function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token_hash') || searchParams.get('token')
  const type = searchParams.get('type')
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>(() => {
    // Si pas de token, c'est que l'utilisateur vient de s'inscrire: on affiche juste le message d'attente.
    if (!token && !type) {
      return 'pending'
    }
    return 'loading'
  })

  useEffect(() => {
    if (!token && !type) {
      return
    }

    // Si token présent, vérifier l'email
    const verify = async () => {
      setStatus('loading')

      try {
        const result = await verifyEmail(token || undefined, type || undefined)
        if (result?.error) {
          setStatus('error')
          toast.error(result.error)
        } else if (result?.success) {
          setStatus('success')
          toast.success('Email vérifié avec succès !')
          // Rediriger après un court délai
          setTimeout(() => {
            router.push(result.redirectTo || '/dashboard')
          }, 1500)
        } else {
          setStatus('error')
          toast.error('La vérification n\'a pas pu être complétée.')
        }
      } catch {
        setStatus('error')
        toast.error('Une erreur est survenue lors de la vérification.')
      }
    }

    verify()
  }, [token, type, router])

  if (status === 'loading') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <IconLoader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Vérification en cours...
          </CardTitle>
          <CardDescription>
            Veuillez patienter pendant la vérification de votre email
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (status === 'pending') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <IconPackage className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Vérifiez votre email
          </CardTitle>
          <CardDescription>
            Nous avons envoyé un lien de vérification à votre adresse email.
            Cliquez sur le lien pour activer votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">Instructions :</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Vérifiez votre boîte de réception</li>
              <li>Cliquez sur le lien de vérification</li>
              <li>Vous serez automatiquement redirigé vers votre tableau de bord</li>
            </ol>
          </div>
          <Button
            onClick={() => router.push('/login')}
            variant="outline"
            className="w-full"
          >
            Retour à la connexion
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (status === 'success') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <IconCheck className="h-12 w-12 text-green-500" />
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
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <IconX className="h-12 w-12 text-destructive" />
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
          onClick={() => router.push('/login')}
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
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <IconLoader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Chargement...
            </CardTitle>
          </CardHeader>
        </Card>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  )
}
