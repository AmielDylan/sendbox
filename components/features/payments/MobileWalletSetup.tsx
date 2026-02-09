'use client'

import { useEffect, useMemo, useState } from 'react'
import { IconCheck, IconDeviceMobile, IconLoader2 } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

type NetworkOption = {
  code: string
  label: string
  description?: string
}

interface MobileWalletSetupProps {
  onCompleted?: () => void
}

const normalizePhone = (input: string) =>
  input.replace(/\s|\(|\)|\.|-/g, '').replace(/^\+/, '')

const stripCountryPrefix = (input: string, country?: string) => {
  if (country === 'BJ' && input.startsWith('229')) {
    return input.slice(3)
  }
  return input
}

const prettifyLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase())

const getNetworkBadgeClass = (label: string) => {
  const normalized = label.toLowerCase()
  if (normalized.includes('mtn')) return 'bg-yellow-400 text-yellow-950'
  if (normalized.includes('moov')) return 'bg-blue-500 text-white'
  if (normalized.includes('celtis') || normalized.includes('celtiis')) {
    return 'bg-emerald-500 text-white'
  }
  return 'bg-slate-100 text-slate-900'
}

const isCeltisNetwork = (option: NetworkOption | undefined, value?: string) => {
  const raw = `${option?.label || ''} ${option?.description || ''} ${
    value || ''
  }`.toLowerCase()
  return raw.includes('celtis') || raw.includes('celtiis') || raw.includes('sbin')
}

export function MobileWalletSetup({ onCompleted }: MobileWalletSetupProps) {
  const { profile } = useAuth()
  const [operator, setOperator] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [networks, setNetworks] = useState<NetworkOption[]>([])
  const [networksLoading, setNetworksLoading] = useState(false)
  const [networksError, setNetworksError] = useState<string | null>(null)
  const [networksSource, setNetworksSource] = useState<
    'api' | 'fallback' | null
  >(null)

  const currentStatus = (profile as any)?.payout_status as
    | 'pending'
    | 'active'
    | undefined

  const profileCountry = (profile as any)?.country as string | undefined
  const payoutProvider = (profile as any)?.payout_provider as
    | 'flutterwave'
    | 'fedapay'
    | 'stripe'
    | null
    | undefined

  useEffect(() => {
    const walletOperator = (profile as any)?.wallet_operator as
      | string
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

  useEffect(() => {
    let active = true

    const fetchNetworks = async () => {
      setNetworksLoading(true)
      setNetworksError(null)
      try {
        const query = profileCountry ? `?country=${profileCountry}` : ''
        const endpoint =
          payoutProvider === 'fedapay'
            ? `/api/fedapay/payment-methods${query || '?country=BJ'}`
            : `/api/flutterwave/mobile-networks${query}`

        const res = await fetch(endpoint)
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(
            data?.error || 'Chargement des réseaux mobiles impossible'
          )
        }

        const list = Array.isArray(data?.data) ? data.data : []
        const normalized = list
          .map((item: any) => {
            const code =
              (typeof item?.code === 'string' && item.code) ||
              (typeof item?.network === 'string' && item.network) ||
              (typeof item?.provider === 'string' && item.provider) ||
              (typeof item?.mode === 'string' && item.mode) ||
              (typeof item?.id === 'string' && item.id) ||
              ''
            if (!code) return null

            const rawLabel =
              (typeof item?.name === 'string' && item.name) ||
              (typeof item?.network === 'string' && item.network) ||
              (typeof item?.code === 'string' && item.code) ||
              (typeof item?.provider === 'string' && item.provider) ||
              (typeof item?.mode === 'string' && item.mode) ||
              code

            const label = prettifyLabel(rawLabel)
            const description =
              item?.name && typeof item?.name === 'string' && item.name !== label
                ? item.name
                : undefined

            return { code, label, description }
          })
          .filter(Boolean) as NetworkOption[]

        if (active) {
          setNetworks(normalized)
          if (typeof data?.source === 'string') {
            setNetworksSource(data.source)
          } else {
            setNetworksSource(null)
          }
        }
      } catch (error) {
        if (active) {
          console.error(error)
          setNetworksError(
            error instanceof Error
              ? error.message
              : 'Impossible de charger les réseaux'
          )
          setNetworks([])
          setNetworksSource(null)
        }
      } finally {
        if (active) setNetworksLoading(false)
      }
    }

    fetchNetworks()
    return () => {
      active = false
    }
  }, [profileCountry])

  const selectedOperator = useMemo(
    () => networks.find(item => item.code === operator),
    [operator, networks]
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

    const normalized = stripCountryPrefix(normalizePhone(phone), profileCountry)

    if (
      profileCountry === 'BJ' &&
      isCeltisNetwork(selectedOperator, operator) &&
      !normalized.startsWith('01')
    ) {
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
      {networksLoading ? (
        <div className="flex items-center gap-2 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
          <IconLoader2 className="h-4 w-4 animate-spin" />
          Chargement des réseaux mobiles...
        </div>
      ) : networks.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {networks.map(item => {
            const selected = item.code === operator
            const badgeClass = getNetworkBadgeClass(item.label)
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => setOperator(item.code)}
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
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold ${badgeClass}`}
                  >
                    {item.label.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          {payoutProvider === 'fedapay'
            ? 'Aucun opérateur Mobile Money disponible pour ce pays.'
            : 'Aucun réseau mobile disponible pour le moment.'}
          {networksError && (
            <span className="block text-xs text-destructive mt-2">
              {networksError}
            </span>
          )}
        </div>
      )}

      {payoutProvider === 'fedapay' && networksSource === 'fallback' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Liste provisoire (fallback) — nous mettrons à jour les opérateurs dès
          que l’API FedaPay expose la liste complète.
        </div>
      )}

      {networksError && networks.length > 0 && (
        <div className="text-xs text-destructive">{networksError}</div>
      )}

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
