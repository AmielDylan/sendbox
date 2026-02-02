'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { IconAlertCircle, IconCheck, IconLoader } from '@tabler/icons-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

export interface ConnectOnboardingPayload {
  country: 'FR' | 'BJ'
  consentAccepted: boolean
  businessWebsite?: string
  personalData: {
    firstName: string
    lastName: string
    email: string
    phone: string
    dob: string
    address: string
    city: string
    postalCode: string
  }
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const IBAN_REGEX = /^[A-Z]{2}\d{2}[A-Z0-9]+$/

export function ConnectOnboardingForm({
  onSubmit,
  onSuccess,
}: ConnectOnboardingFormProps) {
  const { profile, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'country' | 'form'>('country')
  const [country, setCountry] = useState<'FR' | 'BJ'>('FR')
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [hasPrefilled, setHasPrefilled] = useState(false)

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
    businessWebsite: '',
    bankAccountHolder: '',
    iban: '',
    bic: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const profileBirthday =
    (profile as any)?.kyc_birthday || (profile as any)?.birthday || null
  const derivedCountry = useMemo(() => {
    const fromProfile = (profile as any)?.country
    return fromProfile === 'BJ' || fromProfile === 'FR' ? fromProfile : null
  }, [profile])

  useEffect(() => {
    if (hasPrefilled) return
    if (!profile && !user) return

    setFormData(prev => {
      const next = { ...prev }
      if (!next.firstName && (profile as any)?.firstname) {
        next.firstName = (profile as any).firstname
      }
      if (!next.lastName && (profile as any)?.lastname) {
        next.lastName = (profile as any).lastname
      }
      if (!next.email && (profile as any)?.email) {
        next.email = (profile as any).email
      }
      if (!next.email && user?.email) {
        next.email = user.email
      }
      if (!next.phone && (profile as any)?.phone) {
        next.phone = (profile as any).phone
      }
      if (!next.address && (profile as any)?.address) {
        next.address = (profile as any).address
      }
      if (!next.city && (profile as any)?.city) {
        next.city = (profile as any).city
      }
      if (!next.postalCode && (profile as any)?.postal_code) {
        next.postalCode = (profile as any).postal_code
      }

      if (
        (!next.dobDay || !next.dobMonth || !next.dobYear) &&
        typeof profileBirthday === 'string'
      ) {
        const match = profileBirthday.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (match) {
          next.dobYear = next.dobYear || match[1]
          next.dobMonth = next.dobMonth || match[2]
          next.dobDay = next.dobDay || match[3]
        }
      }

      if (!next.bankAccountHolder) {
        const first = next.firstName || (profile as any)?.firstname || ''
        const last = next.lastName || (profile as any)?.lastname || ''
        const full = `${first} ${last}`.trim()
        if (full) {
          next.bankAccountHolder = full
        }
      }

      return next
    })

    if (derivedCountry) {
      setCountry(derivedCountry)
    }

    setHasPrefilled(true)
  }, [derivedCountry, hasPrefilled, profile, profileBirthday, user])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'Prénom requis'
    if (!formData.lastName.trim()) newErrors.lastName = 'Nom requis'
    if (!formData.email.trim()) newErrors.email = 'Email requis'
    if (!EMAIL_REGEX.test(formData.email)) newErrors.email = 'Email invalide'
    if (!formData.phone.trim()) newErrors.phone = 'Téléphone requis'
    if (!formData.dobDay || !formData.dobMonth || !formData.dobYear) {
      newErrors.dob = 'Date de naissance requise'
    }
    if (!formData.address.trim()) newErrors.address = 'Adresse requise'
    if (!formData.city.trim()) newErrors.city = 'Ville requise'
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Code postal requis'
    if (!formData.bankAccountHolder.trim()) {
      newErrors.bankAccountHolder = 'Titulaire du compte requis'
    }
    if (!formData.iban.trim()) newErrors.iban = 'IBAN requis'
    if (!IBAN_REGEX.test(formData.iban.replace(/\s/g, ''))) {
      newErrors.iban = 'IBAN invalide (format: FR XX...)'
    }
    if (!consentAccepted) {
      newErrors.consent = 'Veuillez confirmer l\'exactitude des informations'
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

    const normalizeWebsite = (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) return ''
      if (/^https?:\/\//i.test(trimmed)) return trimmed
      return `https://${trimmed}`
    }

    try {
      await onSubmit({
        country,
        consentAccepted,
        businessWebsite: formData.businessWebsite
          ? normalizeWebsite(formData.businessWebsite)
          : undefined,
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
          Vos données sont sécurisées et seront utilisées pour Stripe Connect
          Custom.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 max-h-[600px] overflow-y-auto">
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
              onChange={e => setFormData({ ...formData, email: e.target.value })}
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
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
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
                onChange={e => setFormData({ ...formData, dobDay: e.target.value })}
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
              onChange={e => setFormData({ ...formData, address: e.target.value })}
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
                onChange={e => setFormData({ ...formData, city: e.target.value })}
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

        <div className="space-y-2 border-t pt-4">
          <div className="flex items-start gap-2">
            <Checkbox
              id="consent"
              checked={consentAccepted}
              onCheckedChange={checked =>
                setConsentAccepted(checked === true)
              }
              disabled={loading}
            />
            <Label htmlFor="consent" className="text-sm leading-5">
              Je confirme que les informations ci-dessus sont conformes à mes
              documents officiels d'identité.
            </Label>
          </div>
          {errors.consent && (
            <p className="text-xs text-red-500">{errors.consent}</p>
          )}
        </div>

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
