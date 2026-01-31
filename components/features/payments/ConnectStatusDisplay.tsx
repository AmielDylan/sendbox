'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  IconCheck,
  IconAlertCircle,
  IconLoader,
  IconRefresh,
} from '@tabler/icons-react'
import { toast } from 'sonner'

interface ConnectStatusDisplayProps {
  onEdit?: () => void
}

export function ConnectStatusDisplay({ onEdit }: ConnectStatusDisplayProps) {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<{
    onboarded: boolean
    chargesEnabled: boolean
    payoutsEnabled: boolean
    requirements?: any
  } | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/stripe/connect/status')

      if (!res.ok) {
        throw new Error('Erreur lors du chargement du statut')
      }

      const data = await res.json()
      setStatus(data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement du statut')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <IconLoader className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erreur</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Impossible de charger le statut de votre compte
          </p>
          <Button
            onClick={fetchStatus}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Account not created yet
  if (!status.onboarded && !status.payoutsEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compte bancaire</CardTitle>
          <CardDescription>
            Configurez votre compte pour recevoir vos paiements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas encore configuré votre compte bancaire. Commencez la
            configuration pour recevoir vos gains.
          </p>
          <Button onClick={onEdit} className="w-full">
            Commencer la configuration
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Account fully activated
  if (status.onboarded && status.payoutsEnabled) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Compte bancaire</CardTitle>
              <CardDescription>
                Votre compte est prêt à recevoir les paiements
              </CardDescription>
            </div>
            <Badge className="border-green-300 bg-green-100 text-green-900">
              <IconCheck className="mr-1 h-3 w-3" />
              Activé
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-md border border-green-200 bg-green-50 p-3">
            <p className="text-sm font-medium text-green-900">
              ✓ Configuration complète
            </p>
            <p className="text-xs text-green-800">
              Vous recevrez vos paiements après chaque livraison validée. Les
              virements arrivent généralement en 2-7 jours ouvrés.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onEdit}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Modifier
            </Button>
            <Button
              onClick={fetchStatus}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <IconRefresh className="mr-1 h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Account in progress
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Compte bancaire</CardTitle>
            <CardDescription>Configuration en cours</CardDescription>
          </div>
          <Badge
            variant="secondary"
            className="border-blue-300 bg-blue-100 text-blue-900"
          >
            <IconLoader className="mr-1 h-3 w-3 animate-spin" />
            En cours
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>
            Stripe vérifie vos informations bancaires. Cela prend généralement
            quelques minutes à quelques heures.
          </AlertDescription>
        </Alert>

        {status.requirements?.currently_due &&
          status.requirements.currently_due.length > 0 && (
            <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-900">
                Documents manquants :
              </p>
              <ul className="list-inside list-disc space-y-1 text-xs text-amber-800">
                {status.requirements.currently_due.map(
                  (item: string, i: number) => (
                    <li key={i}>{item}</li>
                  )
                )}
              </ul>
            </div>
          )}

        <div className="flex gap-2">
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Reprendre la configuration
          </Button>
          <Button
            onClick={fetchStatus}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <IconRefresh className="mr-1 h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
