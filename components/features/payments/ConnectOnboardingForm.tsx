'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IconAlertCircle, IconCheck, IconLoader } from '@tabler/icons-react'
import { toast } from 'sonner'

interface ConnectOnboardingFormProps {
  onSuccess?: () => void
  onLoading?: (loading: boolean) => void
}

export function ConnectOnboardingForm({
  onSuccess,
  onLoading,
}: ConnectOnboardingFormProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'country' | 'form'>('country')
  const [country, setCountry] = useState<'FR' | 'BJ'>('FR')

  // Custom form fields (instead of Stripe forms)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'FR',
    bankAccountHolder: '',
    iban: '',
    bic: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'Prénom requis'
    if (!formData.lastName.trim()) newErrors.lastName = 'Nom requis'
    if (!formData.email.trim()) newErrors.email = 'Email requis'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Email invalide'
    if (!formData.phone.trim()) newErrors.phone = 'Téléphone requis'
    if (!formData.dobDay || !formData.dobMonth || !formData.dobYear)
      newErrors.dob = 'Date de naissance requise'
    if (!formData.address.trim()) newErrors.address = 'Adresse requise'
    if (!formData.city.trim()) newErrors.city = 'Ville requise'
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Code postal requis'
    if (!formData.bankAccountHolder.trim())
      newErrors.bankAccountHolder = 'Titulaire du compte requis'
    if (!formData.iban.trim()) newErrors.iban = 'IBAN requis'
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(formData.iban.replace(/\s/g, '')))
      newErrors.iban = 'IBAN invalide (format: FR XX...)'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs')
      return
    }

    setLoading(true)
    onLoading?.(true)

    try {
      // Step 1: Create Stripe Connect account via API
      const createRes = await fetch('/api/stripe/connect/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country,
          personalData: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            dob: `${formData.dobYear}-${formData.dobMonth}-${formData.dobDay}`,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
          },
          bankData: {
            accountHolder: formData.bankAccountHolder,
            iban: formData.iban.replace(/\s/g, '').toUpperCase(),
            bic: formData.bic,
          },
        }),
      })

      if (!createRes.ok) {
        const error = await createRes.json()
        throw new Error(error.message || 'Erreur lors de la création du compte')
      }

      const { accountId } = await createRes.json()

      // Step 2: Get onboarding link
      const linkRes = await fetch('/api/stripe/connect/onboarding-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })

      if (!linkRes.ok) {
        throw new Error('Erreur lors de la génération du lien')
      }

      const { url } = await linkRes.json()

      // Redirect to Stripe onboarding (stays in iframe/embedded)
      window.location.href = url

      onSuccess?.()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(
        error instanceof Error ? error.message : 'Une erreur est survenue'
      )
      setLoading(false)
      onLoading?.(false)
    }
  }

  if (step === 'country') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurer vos paiements</CardTitle>
          <CardDescription>
            Sélectionnez le pays de votre banque
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="country">Pays</Label>
            <Select value={country} onValueChange={(v: any) => setCountry(v)}>
              <SelectTrigger id="country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FR">France</SelectItem>
                <SelectItem value="BJ">Bénin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setStep('form')} className="w-full">
            Continuer
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations personnelles & bancaires</CardTitle>
        <CardDescription>
          Vos données sont sécurisées par Stripe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 max-h-[600px] overflow-y-auto">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Identité</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-sm">
                Prénom *
              </Label>
              <Input
                id="firstName"
                placeholder="Jean"
                value={formData.firstName}
                onChange={e =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                disabled={loading}
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm">
                Nom *
              </Label>
              <Input
                id="lastName"
                placeholder="Dupont"
                value={formData.lastName}
                onChange={e =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                disabled={loading}
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-sm">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="jean@example.com"
              value={formData.email}
              onChange={e =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={loading}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm">
              Téléphone *
            </Label>
            <Input
              id="phone"
              placeholder="+33612345678"
              value={formData.phone}
              onChange={e =>
                setFormData({ ...formData, phone: e.target.value })
              }
              disabled={loading}
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <Label className="text-sm">Date de naissance *</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Jour"
                type="number"
                min="1"
                max="31"
                value={formData.dobDay}
                onChange={e =>
                  setFormData({ ...formData, dobDay: e.target.value })
                }
                disabled={loading}
              />
              <Input
                placeholder="Mois"
                type="number"
                min="1"
                max="12"
                value={formData.dobMonth}
                onChange={e =>
                  setFormData({ ...formData, dobMonth: e.target.value })
                }
                disabled={loading}
              />
              <Input
                placeholder="Année"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={formData.dobYear}
                onChange={e =>
                  setFormData({ ...formData, dobYear: e.target.value })
                }
                disabled={loading}
              />
            </div>
            {errors.dob && (
              <p className="text-xs text-red-500 mt-1">{errors.dob}</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Adresse</h3>

          <div>
            <Label htmlFor="address" className="text-sm">
              Rue *
            </Label>
            <Input
              id="address"
              placeholder="123 Rue de la Paix"
              value={formData.address}
              onChange={e =>
                setFormData({ ...formData, address: e.target.value })
              }
              disabled={loading}
              className={errors.address ? 'border-red-500' : ''}
            />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city" className="text-sm">
                Ville *
              </Label>
              <Input
                id="city"
                placeholder="Paris"
                value={formData.city}
                onChange={e =>
                  setFormData({ ...formData, city: e.target.value })
                }
                disabled={loading}
                className={errors.city ? 'border-red-500' : ''}
              />
              {errors.city && (
                <p className="text-xs text-red-500 mt-1">{errors.city}</p>
              )}
            </div>
            <div>
              <Label htmlFor="postalCode" className="text-sm">
                Code postal *
              </Label>
              <Input
                id="postalCode"
                placeholder="75001"
                value={formData.postalCode}
                onChange={e =>
                  setFormData({ ...formData, postalCode: e.target.value })
                }
                disabled={loading}
                className={errors.postalCode ? 'border-red-500' : ''}
              />
              {errors.postalCode && (
                <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bank Information */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold text-sm">Informations bancaires</h3>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex gap-2">
            <IconAlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900">
              Vos coordonnées bancaires sont transmises directement à Stripe et
              sécurisées par chiffrement.
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
                // Auto-format with spaces
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

        {/* Actions */}
        <div className="flex gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setStep('country')}
            disabled={loading}
            className="flex-1"
          >
            Retour
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
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
