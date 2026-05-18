import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { isAdmin } from '@/lib/core/admin/actions'
import { sendEmail } from '@/lib/shared/services/email/client'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth admin
  const supabase = await createClient()
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser()
  if (!adminUser || !(await isAdmin())) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { id: userId } = await params

  let body: {
    outcome: string
    verifiedName?: string | null
    rejectionReason?: string | null
    adminNotes?: string | null
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const { outcome, verifiedName, rejectionReason, adminNotes } = body
  if (outcome !== 'VERIFIED' && outcome !== 'REJECTED') {
    return NextResponse.json({ error: 'Outcome invalide' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 2. Charger le profil + dernier review en attente
  const { data: profile } = await admin
    .from('profiles')
    .select('email, firstname, kyc_document_front, kyc_document_back, kyc_selfie')
    .eq('id', userId)
    .single()

  if (!profile) {
    return NextResponse.json(
      { error: 'Utilisateur introuvable' },
      { status: 404 }
    )
  }

  const { data: reviews } = await admin
    .from('kyc_reviews')
    .select('id, mrz_name')
    .eq('user_id', userId)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })
    .limit(1)

  const review = reviews?.[0] ?? null
  const now = new Date().toISOString()

  if (outcome === 'VERIFIED') {
    // 3a. Valider — mettre à jour profile
    const resolvedName = verifiedName || null
    const { error: profileErr } = await admin
      .from('profiles')
      .update({
        verification_status: 'verified',
        verified_at: now,
        verified_name: resolvedName,
      })
      .eq('id', userId)

    if (profileErr) {
      console.error('[kyc/resolve] profile update error:', profileErr)
      return NextResponse.json(
        { error: 'Erreur mise à jour profil' },
        { status: 500 }
      )
    }

    // Supprimer les fichiers du bucket + nullifier les paths
    const toRemove = [
      profile.kyc_document_front,
      profile.kyc_document_back,
      (profile as any).kyc_selfie,
    ].filter(Boolean) as string[]
    if (toRemove.length) {
      await admin.storage.from('kyc-documents').remove(toRemove)
      await admin
        .from('profiles')
        .update({ kyc_document_front: null, kyc_document_back: null, kyc_selfie: null })
        .eq('id', userId)
    }

    // Mettre à jour le kyc_review
    if (review) {
      await admin
        .from('kyc_reviews')
        .update({
          status: 'VERIFIED',
          admin_id: adminUser.id,
          reviewed_at: now,
          admin_notes: adminNotes ?? null,
        })
        .eq('id', review.id)
    }

    // Email de confirmation
    if (profile.email) {
      ;(async () => {
        await sendEmail({
          to: profile.email!,
          subject: 'Votre identité a été vérifiée',
          template: 'notification',
          data: {
            title: 'Identité vérifiée ✓',
            content: `${profile.firstname ? `Bonjour ${profile.firstname},\n\n` : ''}Votre vérification d'identité a été approuvée. Vous pouvez maintenant publier des trajets sur Sendbox.`,
            ctaText: 'Publier un trajet',
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/annonces/new`,
          },
        })
      })().catch(console.error)
    }
  } else {
    // 3b. Rejeter
    if (!rejectionReason?.trim()) {
      return NextResponse.json(
        { error: 'Le motif de refus est obligatoire' },
        { status: 400 }
      )
    }

    const { error: profileErr } = await admin
      .from('profiles')
      .update({
        verification_status: 'rejected',
        kyc_rejection_reason: rejectionReason,
      })
      .eq('id', userId)

    if (profileErr) {
      console.error('[kyc/resolve] profile update error:', profileErr)
      return NextResponse.json(
        { error: 'Erreur mise à jour profil' },
        { status: 500 }
      )
    }

    // Supprimer les fichiers immédiatement + nullifier les paths
    const toRemove = [
      profile.kyc_document_front,
      profile.kyc_document_back,
      (profile as any).kyc_selfie,
    ].filter(Boolean) as string[]
    if (toRemove.length) {
      await admin.storage.from('kyc-documents').remove(toRemove)
      await admin
        .from('profiles')
        .update({ kyc_document_front: null, kyc_document_back: null, kyc_selfie: null })
        .eq('id', userId)
    }

    if (review) {
      await admin
        .from('kyc_reviews')
        .update({
          status: 'REJECTED',
          admin_id: adminUser.id,
          reviewed_at: now,
          admin_notes: adminNotes ?? null,
        })
        .eq('id', review.id)
    }

    // Email de refus
    if (profile.email) {
      ;(async () => {
        await sendEmail({
          to: profile.email!,
          subject: "Vérification d'identité refusée",
          template: 'notification',
          data: {
            title: 'Vérification refusée',
            content: `${profile.firstname ? `Bonjour ${profile.firstname},\n\n` : ''}Votre vérification d'identité a été refusée.\n\nMotif : ${rejectionReason}\n\nVous pouvez relancer la procédure depuis vos réglages.`,
            ctaText: 'Relancer la vérification',
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reglages/kyc`,
          },
        })
      })().catch(console.error)
    }
  }

  revalidatePath('/admin/kyc')
  return NextResponse.json({ ok: true })
}
