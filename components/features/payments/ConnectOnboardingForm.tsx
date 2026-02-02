'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IconAlertCircle, IconCheck, IconLoader } from '@tabler/icons-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

export interface ConnectOnboardingPayload {
  bankData: {
    accountHolder: string
    iban: string
    bic?: string
  }
}

interface ConnectOnboardingFormProps {
  onSubmit: (payload: ConnectOnboardingPayload) => Promise<void>
  onSuccess?: () => void
}

const IBAN_REGEX = /^[A-Z]{2}\d{2}[A-Z0-9]+$/

export function ConnectOnboardingForm({
  onSubmit,
  onSuccess,
}: ConnectOnboardingFormProps) {
  const { profile, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [hasPrefilled, setHasPrefilled] = useState(false)

  const [formData, setFormData] = useState({
    bankAccountHolder: '',
    iban: '',
    bic: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (hasPrefilled) return
    if (!profile && !user) return

    setFormData(prev => {
      const next = { ...prev }
      if (!next.bankAccountHolder) {
        const first = (profile as any)?.firstname || ''
        const last = (profile as any)?.lastname || ''
        const full = `${first} ${last}`.trim()
        if (full) {
          next.bankAccountHolder = full
        }
      }

      return next
    })

    setHasPrefilled(true)
  }, [hasPrefilled, profile, user])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.bankAccountHolder.trim()) {
      newErrors.bankAccountHolder = 'Titulaire du compte requis'
    }
    if (!formData.iban.trim()) newErrors.iban = 'IBAN requis'
    if (!IBAN_REGEX.test(formData.iban.replace(/\s/g, ''))) {
      newErrors.iban = 'IBAN invalide (format: FR XX...)'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs')
      return
    }

    setLoading(true)

    try {
      await onSubmit({
        bankData: {
          accountHolder: formData.bankAccountHolder,
          iban: formData.iban.replace(/\s/g, '').toUpperCase(),
          bic: formData.bic,
        },
      })
      onSuccess?.()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(
        error instanceof Error ? error.message : 'Une erreur est survenue'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
      <Card>
        <CardHeader>
          <CardTitle>Informations bancaires</CardTitle>
          <CardDescription>
            Ajoutez le compte qui recevra vos virements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex gap-2">
            <IconAlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900">
              Vos coordonnées bancaires sont transmises à notre prestataire de
              paiement et sécurisées par chiffrement.
            </p>
          </div>

          <div>
            <Label htmlFor="bankAccountHolder" className="text-sm">
              Titulaire du compte *
            </Label>
            <Input
              id="bankAccountHolder"
              placeholder="Jean Dupont"
              value={formData.bankAccountHolder}
              onChange={e =>
                setFormData({ ...formData, bankAccountHolder: e.target.value })
              }
              disabled={loading}
              className={errors.bankAccountHolder ? 'border-red-500' : ''}
            />
            {errors.bankAccountHolder && (
              <p className="text-xs text-red-500 mt-1">
                {errors.bankAccountHolder}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="iban" className="text-sm">
              IBAN *
            </Label>
            <Input
              id="iban"
              placeholder="FR 76 1234 5678 9012 3456 7890"
              value={formData.iban}
              onChange={e => {
                let val = e.target.value.toUpperCase()
                val = val.replace(/\s/g, '').replace(/(.{4})/g, '$1 ')
                setFormData({ ...formData, iban: val.trim() })
              }}
              disabled={loading}
              className={errors.iban ? 'border-red-500' : ''}
            />
            {errors.iban && (
              <p className="text-xs text-red-500 mt-1">{errors.iban}</p>
            )}
          </div>

          <div>
            <Label htmlFor="bic" className="text-sm">
              BIC (optionnel)
            </Label>
            <Input
              id="bic"
              placeholder="BNPAFRPP"
              value={formData.bic}
              onChange={e =>
                setFormData({ ...formData, bic: e.target.value.toUpperCase() })
              }
              disabled={loading}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? (
              <>
                <IconLoader className="h-4 w-4 mr-2 animate-spin" />
                Vérification...
              </>
            ) : (
              <>
                <IconCheck className="h-4 w-4 mr-2" />
                Activer les paiements
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
