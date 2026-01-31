'use client'

import { useEffect, useMemo, useState } from 'react'
import { IconCheck, IconDeviceMobile } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

const OPERATORS = [
  {
    id: 'mtn_open',
    label: 'MTN',
    description: 'MTN Mobile Money',
    color: 'bg-yellow-400 text-yellow-950',
  },
  {
    id: 'moov',
    label: 'Moov',
    description: 'Moov Money',
    color: 'bg-blue-500 text-white',
  },
  {
    id: 'sbin',
    label: 'Celtis',
    description: 'Celtis Cash',
    color: 'bg-emerald-500 text-white',
  },
] as const

type OperatorId = (typeof OPERATORS)[number]['id']

interface MobileWalletSetupProps {
  onCompleted?: () => void
}

const normalizePhone = (input: string) =>
  input.replace(/\s|\(|\)|\.|-/g, '').replace(/^\+/, '')

const stripCountryPrefix = (input: string) =>
  input.startsWith('229') ? input.slice(3) : input

export function MobileWalletSetup({ onCompleted }: MobileWalletSetupProps) {
  const { profile } = useAuth()
  const [operator, setOperator] = useState<OperatorId | null>(null)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const currentStatus = (profile as any)?.payout_status as
    | 'pending'
    | 'active'
    | undefined

  useEffect(() => {
    const walletOperator = (profile as any)?.wallet_operator as
      | OperatorId
      | undefined
    const walletPhone = (profile as any)?.wallet_phone as string | undefined

    if (walletOperator) {
      setOperator(walletOperator)
    }
    if (walletPhone) {
      setPhone(walletPhone)
    }

    if ((profile as any)?.payout_method === 'mobile_wallet') {
      setOtpSent(currentStatus === 'pending')
    }
  }, [currentStatus, profile])

  const selectedOperator = useMemo(
    () => OPERATORS.find(item => item.id === operator),
    [operator]
  )

  const validateForm = () => {
    if (!operator) {
      toast.error('Sélectionnez un opérateur')
      return false
    }
    if (!phone.trim()) {
      toast.error('Numéro de téléphone requis')
      return false
    }

    const normalized = stripCountryPrefix(normalizePhone(phone))

    if (operator === 'sbin' && !normalized.startsWith('01')) {
      toast.error('Le numéro Celtis doit commencer par 01')
      return false
    }

    return true
  }

  const sendOtp = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const res = await fetch('/api/settings/payout-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'mobile_wallet',
          walletOperator: operator,
          phoneNumber: phone,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Impossible de démarrer la vérification')
      }

      setOtpSent(true)
      setDevOtp(data?.dev_otp || null)
      toast.success('OTP envoyé. Veuillez vérifier votre téléphone.')
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de l’envoi OTP'
      )
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (!validateForm()) return
    if (!otp.trim()) {
      toast.error('Code OTP requis')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/settings/payout-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'mobile_wallet',
          walletOperator: operator,
          phoneNumber: phone,
          otpCode: otp,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'OTP invalide')
      }

      toast.success('Mobile Wallet vérifié avec succès')
      setDevOtp(null)
      onCompleted?.()
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error ? error.message : 'Validation OTP impossible'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        {OPERATORS.map(item => {
          const selected = item.id === operator
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setOperator(item.id)}
              className={`relative rounded-xl border bg-background p-4 text-left transition hover:border-primary/60 hover:shadow-sm ${
                selected
                  ? 'border-primary ring-2 ring-primary/30 shadow-sm'
                  : 'border-border'
              }`}
            >
              {selected && (
                <span className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <IconCheck className="h-4 w-4" />
                </span>
              )}
              <div className="flex items-start gap-3">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold ${item.color}`}
                >
                  {item.label}
                </span>
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="walletPhone">Numéro de téléphone</Label>
          <Input
            id="walletPhone"
            placeholder="+229 01 67 00 00 00"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="walletOperator">Opérateur sélectionné</Label>
          <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm">
            {selectedOperator ? (
              <span className="inline-flex items-center gap-2">
                <IconDeviceMobile className="h-4 w-4" />
                {selectedOperator.label}
              </span>
            ) : (
              'Sélectionnez un opérateur'
            )}
          </div>
        </div>
      </div>

      {currentStatus === 'active' && (
        <Badge className="w-fit" variant="secondary">
          Mobile Wallet actif
        </Badge>
      )}

      {otpSent && (
        <Alert>
          <AlertDescription>
            Un code OTP a été envoyé. Saisissez-le pour confirmer votre numéro.
            {devOtp && (
              <span className="block text-xs text-muted-foreground mt-2">
                OTP (dev) : {devOtp}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {otpSent && (
        <div className="space-y-2">
          <Label htmlFor="otp">Code OTP</Label>
          <Input
            id="otp"
            placeholder="123456"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            disabled={loading}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!otpSent ? (
          <Button onClick={sendOtp} disabled={loading}>
            {loading ? 'Envoi...' : 'Envoyer le code'}
          </Button>
        ) : (
          <Button onClick={verifyOtp} disabled={loading}>
            {loading ? 'Validation...' : 'Valider le code'}
          </Button>
        )}
      </div>
    </div>
  )
}
