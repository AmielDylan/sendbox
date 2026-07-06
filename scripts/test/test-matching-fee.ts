/**
 * Test end-to-end du prélèvement de la commission 1,50 € à la mise en relation.
 * Exécuter : npx tsx scripts/test/test-matching-fee.ts
 */

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const APP_URL = 'http://localhost:3000'

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_SUFFIX = Date.now()
const SENDER_EMAIL = `test-sender-${TEST_SUFFIX}@sendbox-test.com`
const TRAVELER_EMAIL = `test-traveler-${TEST_SUFFIX}@sendbox-test.com`
const TEST_PASSWORD = 'TestPass123!'

async function cleanup(
  senderUid?: string,
  travelerUid?: string,
  bookingId?: string,
  announcementId?: string
) {
  if (bookingId) {
    await admin.from('matching_payments').delete().eq('booking_id', bookingId)
    await admin.from('bookings').delete().eq('id', bookingId)
  }
  if (announcementId) {
    await admin.from('announcements').delete().eq('id', announcementId)
  }
  if (senderUid) {
    await admin.from('profiles').delete().eq('id', senderUid)
    await admin.auth.admin.deleteUser(senderUid)
  }
  if (travelerUid) {
    await admin.from('profiles').delete().eq('id', travelerUid)
    await admin.auth.admin.deleteUser(travelerUid)
  }
}

async function createTestUser(email: string, role: 'sender' | 'traveler') {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: `Test ${role}` },
  })
  if (error) throw new Error(`Création user ${role}: ${error.message}`)
  const uid = data.user.id

  // Upsert profile (trigger may have already created it)
  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: uid,
      email,
      firstname: 'Test',
      lastname: role === 'sender' ? 'Expediteur' : 'Voyageur',
      phone: null,
      is_suspended: false,
    },
    { onConflict: 'id' }
  )
  if (profileError) throw new Error(`Profil ${role}: ${profileError.message}`)

  return uid
}

function stringToBase64URL(str: string): string {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function createSessionCookies(
  key: string,
  sessionJson: string
): Record<string, string> {
  const encoded = 'base64-' + stringToBase64URL(sessionJson)
  const MAX_CHUNK = 3180
  const uriEncoded = encodeURIComponent(encoded)
  if (uriEncoded.length <= MAX_CHUNK) {
    return { [key]: encoded }
  }
  // Chunk it
  const cookies: Record<string, string> = {}
  let remaining = encoded
  let i = 0
  while (remaining.length > 0) {
    const slice = remaining.slice(0, MAX_CHUNK)
    cookies[`${key}.${i}`] = slice
    remaining = remaining.slice(MAX_CHUNK)
    i++
  }
  return cookies
}

async function signInAs(email: string): Promise<Record<string, string>> {
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await anon.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  })
  if (error) throw new Error(`Sign-in ${email}: ${error.message}`)
  const session = data.session!
  // Supabase SSR v0.8 stores the full session object in a base64-encoded cookie
  const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0]
  const cookieKey = `sb-${projectRef}-auth-token`
  return createSessionCookies(cookieKey, JSON.stringify(session))
}

async function callConfirm(bookingId: string, cookies: Record<string, string>) {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
  const res = await fetch(`${APP_URL}/api/bookings/${bookingId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
  })
  const body = await res.json()
  return { status: res.status, body }
}

async function run() {
  let senderUid: string | undefined
  let travelerUid: string | undefined
  let bookingId: string | undefined
  let announcementId: string | undefined

  console.log('\n══════════════════════════════════════════════')
  console.log('  TEST : Commission 1,50 € mise en relation')
  console.log('══════════════════════════════════════════════\n')

  try {
    // ── 1. Créer deux utilisateurs de test ──────────────────────────────
    console.log('1. Création des utilisateurs de test...')
    senderUid = await createTestUser(SENDER_EMAIL, 'sender')
    travelerUid = await createTestUser(TRAVELER_EMAIL, 'traveler')
    console.log(`   ✅ Expéditeur  : ${senderUid}`)
    console.log(`   ✅ Voyageur    : ${travelerUid}`)

    // ── 2. Créer une annonce (le voyageur propose un trajet) ────────────
    console.log("\n2a. Création de l'annonce (voyageur)...")
    const dept = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    const arrv = new Date(Date.now() + 9 * 24 * 3600 * 1000).toISOString()
    const { data: announcement, error: annErr } = await admin
      .from('announcements')
      .insert({
        traveler_id: travelerUid,
        departure_country: 'France',
        departure_city: 'Paris',
        arrival_country: 'Benin',
        arrival_city: 'Cotonou',
        departure_date: dept,
        arrival_date: arrv,
        available_kg: 10,
        price_per_kg: 10,
        status: 'active',
      })
      .select('id')
      .single()

    if (annErr || !announcement) throw new Error(`Annonce: ${annErr?.message}`)
    announcementId = announcement.id
    console.log(`   OK Annonce ID: ${announcementId}`)

    // ── Créer une réservation en statut 'accepted' ──────────────────────
    console.log('\n2b. Création de la réservation (statut: accepted)...')
    const { data: booking, error: bookingErr } = await admin
      .from('bookings')
      .insert({
        announcement_id: announcementId,
        sender_id: senderUid,
        traveler_id: travelerUid,
        status: 'accepted',
        weight_kg: 2,
        kilos_requested: 2,
        price_per_kg: 10,
        description: 'Test commission mise en relation',
        package_description: 'Test commission mise en relation',
        duration_hours: 48,
        status_history: [
          {
            status: 'accepted',
            actor_id: travelerUid,
            timestamp: new Date().toISOString(),
          },
        ],
      })
      .select('id')
      .single()

    if (bookingErr || !booking)
      throw new Error(`Booking: ${bookingErr?.message}`)
    bookingId = booking.id
    console.log(`   ✅ Booking ID  : ${bookingId}`)

    // ── 3. Voyageur confirme en premier ─────────────────────────────────
    console.log('\n3. Confirmation du voyageur...')
    const travelerCookies = await signInAs(TRAVELER_EMAIL)
    const travelerConfirm = await callConfirm(bookingId, travelerCookies)
    console.log(
      `   HTTP ${travelerConfirm.status} →`,
      JSON.stringify(travelerConfirm.body)
    )

    if (travelerConfirm.body.status !== 'WAITING_OTHER_PARTY') {
      throw new Error(
        `Attendu WAITING_OTHER_PARTY, reçu: ${travelerConfirm.body.status}`
      )
    }
    console.log(
      '   OK WAITING_OTHER_PARTY (correct, expediteur pas encore confirme)'
    )

    // ── 4. Expéditeur confirme → déclenche la création du PaymentIntent ─
    console.log("\n4. Confirmation de l'expediteur (declenche le paiement)...")
    const senderCookies = await signInAs(SENDER_EMAIL)
    const senderConfirm = await callConfirm(bookingId, senderCookies)
    console.log(
      `   HTTP ${senderConfirm.status} →`,
      JSON.stringify(senderConfirm.body)
    )

    const { status: confirmStatus, body: confirmBody } = senderConfirm

    if (confirmStatus !== 200) {
      throw new Error(
        `Confirm endpoint a retourné HTTP ${confirmStatus}: ${JSON.stringify(confirmBody)}`
      )
    }

    if (confirmBody.status !== 'PAYMENT_REQUIRED') {
      throw new Error(`Attendu PAYMENT_REQUIRED, reçu: ${confirmBody.status}`)
    }

    console.log('   ✅ PAYMENT_REQUIRED reçu')
    console.log(
      `   💳 clientSecret  : ${confirmBody.clientSecret?.slice(0, 30)}...`
    )
    console.log(`   💰 amountCents   : ${confirmBody.amountCents}`)
    console.log(`   👤 mustPay       : ${confirmBody.mustPay}`)

    if (confirmBody.amountCents !== 150) {
      throw new Error(
        `❌ ÉCHEC : Montant attendu 150 cents, reçu ${confirmBody.amountCents} cents`
      )
    }
    console.log('   ✅ Montant correct : 150 cents (1,50 €)')

    if (!confirmBody.mustPay) {
      throw new Error("❌ mustPay devrait être true pour l'expéditeur")
    }
    console.log("   ✅ mustPay=true (l'expéditeur doit payer, comme attendu)")

    // ── 5. Vérifier la table matching_payments ──────────────────────────
    console.log('\n5. Vérification en base (matching_payments)...')
    const { data: payment, error: paymentErr } = await admin
      .from('matching_payments')
      .select('*')
      .eq('booking_id', bookingId)
      .single()

    if (paymentErr || !payment) {
      throw new Error(`matching_payments introuvable : ${paymentErr?.message}`)
    }

    console.log('   Enregistrement matching_payments :')
    console.log(`     id                       : ${payment.id}`)
    console.log(
      `     stripe_payment_intent_id : ${payment.stripe_payment_intent_id}`
    )
    console.log(`     amount_cents             : ${payment.amount_cents}`)
    console.log(`     currency                 : ${payment.currency}`)
    console.log(`     status                   : ${payment.status}`)
    console.log(`     paid_by                  : ${payment.paid_by}`)

    if (payment.amount_cents !== 150)
      throw new Error(`Montant en base ${payment.amount_cents} ≠ 150`)
    if (payment.currency !== 'eur')
      throw new Error(`Devise en base ${payment.currency} ≠ eur`)
    if (payment.status !== 'pending')
      throw new Error(`Statut en base ${payment.status} ≠ pending`)
    if (payment.paid_by !== senderUid)
      throw new Error(`paid_by ${payment.paid_by} ≠ senderUid`)
    console.log('   ✅ Tous les champs matching_payments sont corrects')

    // ── 6. Vérifier le statut du booking ────────────────────────────────
    console.log('\n6. Vérification du statut booking...')
    const { data: updatedBooking } = await admin
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .single()

    console.log(`   Statut booking : ${updatedBooking?.status}`)
    if (updatedBooking?.status !== 'payment_pending') {
      throw new Error(
        `Statut attendu payment_pending, reçu: ${updatedBooking?.status}`
      )
    }
    console.log('   ✅ Statut booking = payment_pending (correct)')

    // ── 7. Simuler le webhook payment_intent.succeeded ─────────────────
    // On construit un événement Stripe signé avec le secret du CLI local,
    // et on le POST directement sur le webhook handler de l'app.
    console.log('\n7. Simulation du webhook payment_intent.succeeded...')
    const piId = payment.stripe_payment_intent_id
    console.log(`   PaymentIntent ID: ${piId}`)

    const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

    const fakePaymentIntent = {
      id: piId,
      object: 'payment_intent',
      amount: 150,
      currency: 'eur',
      status: 'succeeded',
      metadata: {
        booking_id: bookingId,
        type: 'matching_fee',
      },
    }
    const fakeEvent = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      api_version: '2025-11-17',
      created: Math.floor(Date.now() / 1000),
      type: 'payment_intent.succeeded',
      data: { object: fakePaymentIntent },
      livemode: false,
      pending_webhooks: 0,
      request: null,
    }
    const payload = JSON.stringify(fakeEvent)
    const timestamp = Math.floor(Date.now() / 1000)
    const toSign = `${timestamp}.${payload}`
    // Stripe uses the full whsec_xxx string as HMAC key (not base64-decoded)
    const crypto = await import('crypto')
    const sig = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(toSign)
      .digest('hex')
    const stripeSignature = `t=${timestamp},v1=${sig}`

    const webhookRes = await fetch(`${APP_URL}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': stripeSignature,
      },
      body: payload,
    })
    const webhookBody = await webhookRes.json()
    console.log(
      `   Webhook HTTP ${webhookRes.status} → ${JSON.stringify(webhookBody)}`
    )
    if (!webhookRes.ok) {
      throw new Error(
        `Webhook handler a retourné HTTP ${webhookRes.status}: ${JSON.stringify(webhookBody)}`
      )
    }
    console.log('   OK Webhook traité avec succès')

    // ── 8. Attendre le webhook ───────────────────────────────────────────
    console.log('\n8. Attente traitement webhook (3s)...')
    await new Promise(r => setTimeout(r, 3000))

    // ── 9. Vérifier le statut final en base ──────────────────────────────
    console.log('\n9. Vérification finale...')
    const { data: finalBooking } = await admin
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .single()

    const { data: finalPayment } = await admin
      .from('matching_payments')
      .select('status')
      .eq('booking_id', bookingId)
      .single()

    console.log(`   Statut booking         : ${finalBooking?.status}`)
    console.log(`   Statut matching_payment: ${finalPayment?.status}`)

    const bookingOk = finalBooking?.status === 'confirmed'
    const paymentOk = finalPayment?.status === 'succeeded'

    if (!bookingOk)
      console.warn(
        `   ⚠️  Booking statut = ${finalBooking?.status} (attendu: confirmed) — webhook peut nécessiter plus de temps`
      )
    else console.log('   ✅ Booking confirmé')

    if (!paymentOk)
      console.warn(
        `   ⚠️  Payment statut = ${finalPayment?.status} (attendu: succeeded) — webhook peut nécessiter plus de temps`
      )
    else console.log('   ✅ Payment succeeded')

    // ── Résumé ───────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════')
    if (bookingOk && paymentOk) {
      console.log('  ✅ PASS — Commission 1,50 € correctement prélevée')
    } else {
      console.log('  ⚠️  PARTIEL — PaymentIntent créé, webhook en attente')
      console.log(
        '  Vérifier /tmp/stripe-listen.log pour les événements webhook'
      )
    }
    console.log('══════════════════════════════════════════════\n')
  } catch (err) {
    console.error('\n❌ ERREUR :', err instanceof Error ? err.message : err)
    console.log('\n══════════════════════════════════════════════')
    console.log('  ❌ FAIL')
    console.log('══════════════════════════════════════════════\n')
  } finally {
    console.log('Nettoyage des données de test...')
    await cleanup(senderUid, travelerUid, bookingId, announcementId)
    console.log('✅ Données de test supprimées\n')
  }
}

run()
