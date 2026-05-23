import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { isAdmin } from '@/lib/core/admin/actions'
import { createAdminClient } from '@/lib/shared/db/admin'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { KYCResolveForm } from './kyc-resolve-form'
import { KYCProtectedImage } from './kyc-protected-image'
import { ApproveCountryButton } from './approve-country-button'

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
    .select(
      'id, firstname, lastname, email, verification_status, kyc_document_front, kyc_document_back, kyc_selfie, kyc_submitted_at, kyc_rejection_reason'
    )
    .eq('id', id)
    .single()

  if (!profile) redirect('/admin/kyc')

  const { data: reviews } = await admin
    .from('kyc_reviews')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(1)

  const review = reviews?.[0] ?? null

  // Générer les signed URLs (10 min)
  const signedUrls: {
    front: string | null
    back: string | null
    selfie: string | null
  } = { front: null, back: null, selfie: null }

  if (profile.kyc_document_front) {
    const { data } = await admin.storage
      .from('kyc-documents')
      .createSignedUrl(profile.kyc_document_front as string, 600)
    signedUrls.front = data?.signedUrl ?? null
  }
  if (profile.kyc_document_back) {
    const { data } = await admin.storage
      .from('kyc-documents')
      .createSignedUrl(profile.kyc_document_back as string, 600)
    signedUrls.back = data?.signedUrl ?? null
  }
  if (profile.kyc_selfie) {
    const { data } = await admin.storage
      .from('kyc-documents')
      .createSignedUrl(profile.kyc_selfie, 600)
    signedUrls.selfie = data?.signedUrl ?? null
  }

  const profileName =
    [profile.lastname, profile.firstname].filter(Boolean).join(' ') || null

  const displayName = profileName ?? 'Utilisateur'

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dossier KYC : ${displayName}`}
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
          {/* Document : recto + verso côte à côte si verso présent */}
          <div
            className={cn(
              'grid gap-4',
              signedUrls.back ? 'lg:grid-cols-2' : 'lg:grid-cols-1'
            )}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Recto / Page principale
                </CardTitle>
              </CardHeader>
              <CardContent>
                {signedUrls.front ? (
                  <KYCProtectedImage
                    src={signedUrls.front}
                    alt="Recto document"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun document disponible
                  </p>
                )}
              </CardContent>
            </Card>

            {signedUrls.back && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Verso / Page suivante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <KYCProtectedImage
                    src={signedUrls.back}
                    alt="Verso document"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Selfie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Selfie avec la pièce</CardTitle>
            </CardHeader>
            <CardContent>
              {signedUrls.selfie ? (
                <KYCProtectedImage src={signedUrls.selfie} alt="Selfie" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun selfie disponible
                </p>
              )}
            </CardContent>
          </Card>

          {profile.kyc_submitted_at && (
            <p className="text-xs text-muted-foreground">
              Soumis le{' '}
              {format(new Date(profile.kyc_submitted_at as string), 'PPp', {
                locale: fr,
              })}
            </p>
          )}
        </div>

        {/* Colonne droite — Infos + Actions */}
        <div className="space-y-4">
          {/* Infos document soumis */}
          {review &&
            ((review as any).doc_type || (review as any).doc_country) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Document soumis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(review as any).doc_type && (
                    <MRZRow
                      label="Type de pièce"
                      value={
                        (review as any).doc_type === 'passport'
                          ? 'Passeport'
                          : "Carte nationale d'identité"
                      }
                    />
                  )}
                  {(review as any).doc_country && (
                    <MRZRow
                      label="Pays d'émission"
                      value={
                        (review as any).doc_country === 'other'
                          ? `Autre : ${(review as any).custom_country ?? '?'}`
                          : (review as any).doc_country
                      }
                    />
                  )}
                  {(review as any).custom_country && (
                    <div className="pt-1 space-y-2">
                      <p className="text-xs text-amber-600">
                        Pays non répertorié :{' '}
                        <strong>{(review as any).custom_country}</strong>
                      </p>
                      <ApproveCountryButton
                        userId={id}
                        label={(review as any).custom_country}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Formulaire de résolution ou statut final */}
          {profile.verification_status === 'pending' ? (
            <KYCResolveForm
              userId={id}
              profileName={profileName}
              frontSignedUrl={signedUrls.front}
              backSignedUrl={signedUrls.back}
              documentType={(review as any)?.doc_type ?? null}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Décision admin</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.verification_status === 'verified' ? (
                  <p className="text-sm text-green-700 font-medium">
                    Identité vérifiée. Aucune action supplémentaire.
                  </p>
                ) : profile.verification_status === 'rejected' ? (
                  <div className="space-y-2">
                    <p className="text-sm text-destructive font-medium">
                      Dossier rejeté.
                    </p>
                    {profile.kyc_rejection_reason && (
                      <p className="text-xs text-muted-foreground">
                        Motif : {profile.kyc_rejection_reason as string}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun dossier en attente.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
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
