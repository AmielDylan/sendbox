/**
 * End-to-end test for blind reviews.
 *
 * Run:
 *   npx tsx scripts/test/test-review-flow.ts
 *
 * Requires:
 *   - .env.local with Supabase service/anon keys
 *   - Next app running on http://localhost:3000, or APP_URL set
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_SUFFIX = Date.now()
const SENDER_EMAIL = `test-review-sender-${TEST_SUFFIX}@sendbox-test.com`
const TRAVELER_EMAIL = `test-review-traveler-${TEST_SUFFIX}@sendbox-test.com`
const TEST_PASSWORD = 'TestPass123!'

async function cleanup(
  senderUid?: string,
  travelerUid?: string,
  bookingId?: string,
  announcementId?: string
) {
  if (bookingId) {
    await admin.from('ratings').delete().eq('booking_id', bookingId)
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
    user_metadata: { full_name: `Review ${role}` },
  })

  if (error) throw new Error(`Create user ${role}: ${error.message}`)

  const uid = data.user.id

  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: uid,
      email,
      firstname: 'Review',
      lastname: role === 'sender' ? 'Sender' : 'Traveler',
      phone: null,
      is_suspended: false,
    },
    { onConflict: 'id' }
  )

  if (profileError) throw new Error(`Profile ${role}: ${profileError.message}`)

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
  const maxChunk = 3180
  const uriEncoded = encodeURIComponent(encoded)

  if (uriEncoded.length <= maxChunk) {
    return { [key]: encoded }
  }

  const cookies: Record<string, string> = {}
  let remaining = encoded
  let i = 0

  while (remaining.length > 0) {
    cookies[`${key}.${i}`] = remaining.slice(0, maxChunk)
    remaining = remaining.slice(maxChunk)
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
  const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0]
  const cookieKey = `sb-${projectRef}-auth-token`

  return createSessionCookies(cookieKey, JSON.stringify(session))
}

async function callReview(
  bookingId: string,
  cookies: Record<string, string>,
  rating: number,
  comment: string
) {
  const cookieHeader = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ')

  const res = await fetch(`${APP_URL}/api/bookings/${bookingId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ rating, comment }),
  })

  return { status: res.status, body: await res.json() }
}

async function getRatings(bookingId: string) {
  const { data, error } = await admin
    .from('ratings')
    .select('id, rater_id, rated_id, rating, comment, status, published_at')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Fetch ratings: ${error.message}`)

  return data ?? []
}

async function run() {
  let senderUid: string | undefined
  let travelerUid: string | undefined
  let bookingId: string | undefined
  let announcementId: string | undefined

  console.log('\n==============================================')
  console.log('  TEST: Blind review publication flow')
  console.log('==============================================\n')

  try {
    console.log('1. Creating test users...')
    senderUid = await createTestUser(SENDER_EMAIL, 'sender')
    travelerUid = await createTestUser(TRAVELER_EMAIL, 'traveler')
    console.log(`   Sender   : ${senderUid}`)
    console.log(`   Traveler : ${travelerUid}`)

    console.log('\n2. Creating completed booking...')
    const departureDate = new Date(Date.now() + 7 * 24 * 3600 * 1000)
    const arrivalDate = new Date(Date.now() + 9 * 24 * 3600 * 1000)

    const { data: announcement, error: announcementError } = await admin
      .from('announcements')
      .insert({
        traveler_id: travelerUid,
        departure_country: 'France',
        departure_city: 'Paris',
        arrival_country: 'Benin',
        arrival_city: 'Cotonou',
        departure_date: departureDate.toISOString(),
        arrival_date: arrivalDate.toISOString(),
        available_kg: 10,
        price_per_kg: 10,
        status: 'active',
      })
      .select('id')
      .single()

    if (announcementError || !announcement) {
      throw new Error(`Announcement: ${announcementError?.message}`)
    }

    announcementId = announcement.id

    const completedAt = new Date().toISOString()
    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .insert({
        announcement_id: announcementId,
        sender_id: senderUid,
        traveler_id: travelerUid,
        status: 'completed',
        weight_kg: 2,
        kilos_requested: 2,
        price_per_kg: 10,
        description: 'Test blind review flow',
        package_description: 'Test blind review flow',
        duration_hours: 48,
        delivery_confirmed_at: completedAt,
        completed_at: completedAt,
        status_history: [
          {
            status: 'completed',
            actor_id: travelerUid,
            timestamp: completedAt,
          },
        ],
      })
      .select('id')
      .single()

    if (bookingError || !booking) {
      throw new Error(`Booking: ${bookingError?.message}`)
    }

    bookingId = booking.id
    console.log(`   Booking  : ${bookingId}`)

    const senderCookies = await signInAs(SENDER_EMAIL)
    const travelerCookies = await signInAs(TRAVELER_EMAIL)

    console.log('\n3. Sender submits first review...')
    const senderReview = await callReview(
      bookingId,
      senderCookies,
      5,
      'Voyageur fiable et communication claire.'
    )
    console.log(
      `   HTTP ${senderReview.status} -> ${JSON.stringify(senderReview.body)}`
    )

    if (senderReview.status !== 200 || !senderReview.body.success) {
      throw new Error(`Sender review failed: ${JSON.stringify(senderReview)}`)
    }

    let ratings = await getRatings(bookingId)
    console.log(
      `   Ratings after first review: ${ratings.map(r => r.status).join(', ')}`
    )

    if (ratings.length !== 1 || ratings[0].status !== 'submitted') {
      throw new Error('First review should remain submitted and unpublished')
    }

    console.log('\n4. Traveler submits second review...')
    const travelerReview = await callReview(
      bookingId,
      travelerCookies,
      4,
      'Expediteur ponctuel, colis conforme.'
    )
    console.log(
      `   HTTP ${travelerReview.status} -> ${JSON.stringify(travelerReview.body)}`
    )

    if (travelerReview.status !== 200 || !travelerReview.body.success) {
      throw new Error(
        `Traveler review failed: ${JSON.stringify(travelerReview)}`
      )
    }

    ratings = await getRatings(bookingId)
    console.log(
      `   Ratings after second review: ${ratings.map(r => r.status).join(', ')}`
    )

    const published = ratings.filter(r => r.status === 'published')

    if (ratings.length !== 2 || published.length !== 2) {
      throw new Error('Both reviews should be published together')
    }

    if (published.some(r => !r.published_at)) {
      throw new Error('Published reviews should have published_at set')
    }

    console.log('   OK both reviews published simultaneously')

    console.log('\n5. Sender tries to edit published review...')
    const duplicateReview = await callReview(
      bookingId,
      senderCookies,
      1,
      'This edit must be rejected.'
    )
    console.log(
      `   HTTP ${duplicateReview.status} -> ${JSON.stringify(duplicateReview.body)}`
    )

    if (
      duplicateReview.status !== 403 ||
      duplicateReview.body.code !== 'REVIEW_IMMUTABLE'
    ) {
      throw new Error('Published review should be immutable')
    }

    console.log('\n==============================================')
    console.log('  PASS - Blind review flow works')
    console.log('==============================================\n')
  } catch (err) {
    console.error('\nERROR:', err instanceof Error ? err.message : err)
    console.log('\n==============================================')
    console.log('  FAIL')
    console.log('==============================================\n')
    process.exitCode = 1
  } finally {
    console.log('Cleaning test data...')
    await cleanup(senderUid, travelerUid, bookingId, announcementId)
    console.log('Test data removed\n')
  }
}

run()
