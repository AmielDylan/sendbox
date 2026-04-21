import { createClient } from '@/lib/shared/db/server'

const FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY
const FEDAPAY_BASE_URL =
  process.env.FEDAPAY_BASE_URL || 'https://api.fedapay.com/v1'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// XOF is pegged to EUR at 655.957 — 4.99€ × 655.957 ≈ 3,275 XOF
export const SUBSCRIPTION_AMOUNT_XOF = 3275

export async function createFedaPaySubscriptionCheckout(): Promise<
  { url: string } | { error: string }
> {
  if (!FEDAPAY_SECRET_KEY) {
    return { error: 'Clé FedaPay manquante' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Non authentifié' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, full_name, subscription_status')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Profil introuvable' }
  }

  if ((profile as any).subscription_status === 'active') {
    return { error: 'Vous êtes déjà abonné' }
  }

  const nameParts = ((profile as any).full_name || '').trim().split(/\s+/)
  const firstname = nameParts[0] || 'Utilisateur'
  const lastname = nameParts.slice(1).join(' ') || 'Sendbox'

  try {
    const res = await fetch(`${FEDAPAY_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FEDAPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Abonnement voyageur Sendbox — 1 mois',
        amount: SUBSCRIPTION_AMOUNT_XOF,
        currency: { iso: 'XOF' },
        callback_url: `${BASE_URL}/dashboard/reglages/abonnement`,
        merchant_reference: `sub_${user.id}`,
        customer: {
          firstname,
          lastname,
          email: (profile as any).email || user.email,
          phone_number: { number: '00000000', country: 'bj' },
        },
      }),
    })

    const data = await res.json()
    const transaction =
      data['v1/transaction'] || data.transaction || data

    if (!transaction?.id || !transaction?.payment_url) {
      console.error('FedaPay subscription transaction error:', data)
      return { error: 'Erreur lors de la création du paiement FedaPay' }
    }

    return { url: transaction.payment_url }
  } catch (err) {
    console.error('FedaPay subscription checkout error:', err)
    return { error: 'Erreur de connexion FedaPay' }
  }
}
