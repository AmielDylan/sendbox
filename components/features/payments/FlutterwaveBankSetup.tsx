'use client'

import { useEffect, useMemo, useState } from 'react'
import { IconLoader2 } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

interface FlutterwaveBankSetupProps {
  onCompleted?: () => void
}

type BankOption = {
  code: string
  name: string
}

export function FlutterwaveBankSetup({ onCompleted }: FlutterwaveBankSetupProps) {
  const { profile } = useAuth()
  const [accountNumber, setAccountNumber] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [accountName, setAccountName] = useState('')
  const [currency, setCurrency] = useState('XOF')
  const [loading, setLoading] = useState(false)
  const [banks, setBanks] = useState<BankOption[]>([])
  const [banksLoading, setBanksLoading] = useState(false)
  const [banksError, setBanksError] = useState<string | null>(null)

  const currentStatus = (profile as any)?.payout_status as
    | 'pending'
    | 'active'
    | 'disabled'
    | undefined

  const profileCountry = (profile as any)?.country as string | undefined

  useEffect(() => {
    if ((profile as any)?.flutterwave_bank_account_number) {
      setAccountNumber((profile as any).flutterwave_bank_account_number)
    }
    if ((profile as any)?.flutterwave_bank_code) {
      setBankCode((profile as any).flutterwave_bank_code)
    }
    if ((profile as any)?.flutterwave_bank_account_name) {
      setAccountName((profile as any).flutterwave_bank_account_name)
    }
    if ((profile as any)?.flutterwave_recipient_currency) {
      setCurrency((profile as any).flutterwave_recipient_currency)
    }
  }, [profile])

  useEffect(() => {
    if (!profileCountry) return
    let active = true

    const fetchBanks = async () => {
      setBanksLoading(true)
      setBanksError(null)
      try {
        const res = await fetch(
          `/api/flutterwave/banks?country=${profileCountry}`
        )
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(data?.error || 'Chargement des banques impossible')
        }

        const list = Array.isArray(data?.data) ? data.data : []
        const normalized = list
          .map((bank: any): BankOption => ({
            code: typeof bank?.code === 'string' ? bank.code : '',
            name:
              typeof bank?.name === 'string'
                ? bank.name
                : typeof bank?.code === 'string'
                  ? bank.code
                  : '',
          }))
          .filter((bank: BankOption) => bank.code && bank.name)
          .sort((a: BankOption, b: BankOption) =>
            a.name.localeCompare(b.name, 'fr')
          )

        if (active) {
          setBanks(normalized)
        }
      } catch (error) {
        if (active) {
          console.error(error)
          setBanksError(
            error instanceof Error
              ? error.message
              : 'Impossible de charger les banques'
          )
          setBanks([])
        }
      } finally {
        if (active) setBanksLoading(false)
      }
    }

    fetchBanks()
    return () => {
      active = false
    }
  }, [profileCountry])

  const bankOptions = useMemo(() => banks, [banks])
  const hasBankOptions = bankOptions.length > 0
  const selectedBankLabel = useMemo(
    () => bankOptions.find(bank => bank.code === bankCode)?.name,
    [bankCode, bankOptions]
  )

  const handleSubmit = async () => {
    if (!accountNumber.trim() || !bankCode.trim() || !accountName.trim()) {
      toast.error('Tous les champs bancaires sont requis')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/settings/payout-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'bank_transfer',
          bankAccountNumber: accountNumber,
          bankCode,
          bankAccountName: accountName,
          bankCurrency: currency,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Impossible de configurer le compte')
      }

      toast.success('Compte bancaire enregistré avec succès')
      onCompleted?.()
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la configuration'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bankAccountName">Titulaire du compte</Label>
          <Input
            id="bankAccountName"
            value={accountName}
            onChange={e => setAccountName(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankAccountNumber">Numéro de compte</Label>
          <Input
            id="bankAccountNumber"
            value={accountNumber}
            onChange={e => setAccountNumber(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankCode">Banque</Label>
          {banksLoading ? (
            <div className="flex h-10 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
              <IconLoader2 className="h-4 w-4 animate-spin" />
              Chargement des banques...
            </div>
          ) : hasBankOptions ? (
            <Select
              value={bankCode}
              onValueChange={value => setBankCode(value)}
              disabled={loading}
            >
              <SelectTrigger id="bankCode">
                <SelectValue
                  placeholder="Sélectionner une banque"
                  aria-label={selectedBankLabel || 'Sélectionner une banque'}
                />
              </SelectTrigger>
              <SelectContent>
                {bankOptions.map(bank => (
                  <SelectItem key={bank.code} value={bank.code}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="bankCode"
              value={bankCode}
              onChange={e => setBankCode(e.target.value)}
              placeholder="Code banque"
              disabled={loading}
            />
          )}
          {banksError && (
            <p className="text-xs text-destructive">{banksError}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankCurrency">Devise</Label>
          <Input
            id="bankCurrency"
            value={currency}
            onChange={e => setCurrency(e.target.value.toUpperCase())}
            disabled={loading}
          />
        </div>
      </div>

      {currentStatus === 'active' && (
        <Badge className="w-fit" variant="secondary">
          Compte bancaire actif
        </Badge>
      )}

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Enregistrement...' : 'Enregistrer'}
      </Button>
    </div>
  )
}
