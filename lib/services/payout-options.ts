import {
  listFlutterwaveBanks,
  listFlutterwaveMobileNetworks,
} from '@/lib/services/flutterwave'
import {
  listFedaPayPaymentMethods,
} from '@/lib/services/fedapay'

export type BankOption = {
  code: string
  name: string
  provider: 'stripe' | 'flutterwave' | 'fedapay'
  kind: 'bank' | 'mobile'
}

export async function getAvailableBanks(countryCode: string) {
  const country = countryCode.toUpperCase()

  if (country === 'FR') {
    return {
      provider: 'stripe' as const,
      kind: 'bank' as const,
      options: [
        {
          code: 'stripe_bank',
          name: 'Compte bancaire (Stripe)',
          provider: 'stripe' as const,
          kind: 'bank' as const,
        },
      ],
    }
  }

  if (country === 'BJ') {
    const methods = await listFedaPayPaymentMethods(country)
    const options = methods.data
      .map(method => ({
        code: String(method.code || method.name || '').toLowerCase(),
        name: method.name || method.code || 'Mobile Money',
        provider: 'fedapay' as const,
        kind: 'mobile' as const,
      }))
      .filter(option => option.code)

    return {
      provider: 'fedapay' as const,
      kind: 'mobile' as const,
      options,
      source: methods.source,
    }
  }

  const banks = await listFlutterwaveBanks(country)
  const options = (banks.data || [])
    .map(bank => ({
      code: String(bank.code || ''),
      name: bank.name || bank.code || 'Banque',
      provider: 'flutterwave' as const,
      kind: 'bank' as const,
    }))
    .filter(option => option.code)

  return {
    provider: 'flutterwave' as const,
    kind: 'bank' as const,
    options,
  }
}

export async function getAvailableMobileNetworks(countryCode: string) {
  const country = countryCode.toUpperCase()
  const networks = await listFlutterwaveMobileNetworks(country)
  const options = (networks.data || [])
    .map(network => ({
      code: String(network.code || network.network || ''),
      name: network.name || network.network || network.code || 'Mobile Money',
      provider: 'flutterwave' as const,
      kind: 'mobile' as const,
    }))
    .filter(option => option.code)

  return options
}
