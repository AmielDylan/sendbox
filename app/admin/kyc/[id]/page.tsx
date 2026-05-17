import { redirect } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { isAdmin } from '@/lib/core/admin/actions'
import { createAdminClient } from '@/lib/shared/db/admin'
import { processKYCMRZ } from '@/lib/core/kyc/mrz'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
} from '@tabler/icons-react'
import { KYCResolveForm } from './kyc-resolve-form'

export const dynamic = 'force-dynamic'

export default async function AdminKYCDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!(await isAdmin())) redirect('/')

  const { id } = await params
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('id, firstname, lastname, email, verification_status, kyc_document_front, kyc_document_back, kyc_submitted_at, kyc_rejection_reason')
    .eq('id', id)
    .single()

  if (!profile) redirect('/admin/kyc')

  const { data: reviews } = await admin
    .from('kyc_reviews')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(1)

  let review = reviews?.[0] ?? null

  // Déclencher le MRZ si pas encore traité et qu'un document existe
  if (
    profile.kyc_document_front &&
    review &&
    review.mrz_valid === null &&
    review.status === 'PENDING'
  ) {
    try {
      await processKYCMRZ(id, profile.kyc_document_front)
      // Recharger le review mis à jour
      const { data: refreshed } = await admin
        .from('kyc_reviews')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
      review = refreshed?.[0] ?? review
    } catch (err) {
      console.error('[admin/kyc/[id]] MRZ processing failed:', err)
    }
  }

  // Générer les signed URLs (10 min)
  const signedUrls: { doc: string | null; selfie: string | null } = { doc: null, selfie: null }
  if (profile.kyc_document_front) {
    const { data } = await admin.storage
      .from('kyc-documents')
      .createSignedUrl(profile.kyc_document_front as string, 600)
    signedUrls.doc = data?.signedUrl ?? null
  }
  if (profile.kyc_document_back) {
    const { data } = await admin.storage
      .from('kyc-documents')
      .createSignedUrl(profile.kyc_document_back as string, 600)
    signedUrls.selfie = data?.signedUrl ?? null
  }

  const displayName = [profile.firstname, profile.lastname].filter(Boolean).join(' ') || 'Utilisateur'

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dossier KYC — ${displayName}`}
        description={profile.email ?? ''}
        breadcrumbs={[
          { label: 'Dashboard Admin', href: '/admin/dashboard' },
          { label: 'KYC', href: '/admin/kyc' },
          { label: displayName },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Colonne gauche — Photos */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pièce d&apos;identité</CardTitle>
            </CardHeader>
            <CardContent>
              {signedUrls.doc ? (
                <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src={signedUrls.doc}
                    alt="Document d'identité"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun document disponible</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Selfie avec la pièce</CardTitle>
            </CardHeader>
            <CardContent>
              {signedUrls.selfie ? (
                <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src={signedUrls.selfie}
                    alt="Selfie"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun selfie disponible</p>
              )}
            </CardContent>
          </Card>

          {profile.kyc_submitted_at && (
            <p className="text-xs text-muted-foreground">
              Soumis le{' '}
              {format(new Date(profile.kyc_submitted_at as string), 'PPp', { locale: fr })}
            </p>
          )}
        </div>

        {/* Colonne droite — MRZ + Actions */}
        <div className="space-y-4">
          {/* Résultats MRZ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Résultats MRZ</CardTitle>
            </CardHeader>
            <CardContent>
              {!review ? (
                <p className="text-sm text-muted-foreground">Aucun résultat MRZ disponible</p>
              ) : review.mrz_valid === null ? (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <IconAlertTriangle className="h-4 w-4" />
                  Extraction en attente de traitement
                </div>
              ) : !review.mrz_valid ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <IconAlertTriangle className="h-4 w-4" />
                    Extraction automatique échouée — vérification manuelle requise
                  </div>
                  {review.ocr_confidence !== null && (
                    <p className="text-xs text-muted-foreground">
                      Confiance OCR : {Math.round((review.ocr_confidence ?? 0) * 100)}%
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <MRZRow label="MRZ détectée" value={<StatusIcon ok />} />
                  <MRZRow label="Checksums" value={<StatusIcon ok />} />
                  {review.mrz_name && <MRZRow label="Nom extrait" value={review.mrz_name} />}
                  {review.mrz_nationality && <MRZRow label="Nationalité" value={review.mrz_nationality} />}
                  {review.mrz_birth_date && <MRZRow label="Date naissance" value={formatMRZDate(review.mrz_birth_date)} />}
                  {review.mrz_expiry && (
                    <MRZRow
                      label="Expiration"
                      value={
                        <span className={review.mrz_expired ? 'text-destructive' : ''}>
                          {formatMRZDate(review.mrz_expiry)}{' '}
                          {review.mrz_expired ? (
                            <Badge variant="destructive" className="text-xs">Expiré</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Valide</Badge>
                          )}
                        </span>
                      }
                    />
                  )}
                  {review.ocr_confidence !== null && (
                    <MRZRow
                      label="Confiance OCR"
                      value={`${Math.round((review.ocr_confidence ?? 0) * 100)}%`}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulaire de résolution */}
          <KYCResolveForm
            userId={id}
            suggestedName={review?.mrz_name ?? null}
            mrzFailed={!review?.mrz_valid}
          />
        </div>
      </div>
    </div>
  )
}

function MRZRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}

function StatusIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <IconCheck className="h-4 w-4 text-green-600" />
  ) : (
    <IconX className="h-4 w-4 text-destructive" />
  )
}

function formatMRZDate(raw: string): string {
  if (raw.length !== 6) return raw
  const year = parseInt(raw.slice(0, 2), 10)
  const month = raw.slice(2, 4)
  const fullYear = year >= 0 && year <= 30 ? 2000 + year : 1900 + year
  return `${month}/${fullYear}`
}
