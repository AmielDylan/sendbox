/**
 * Page affichage preuve de dépôt PDF
 */

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getContractUrl, generateDepositProof } from '@/lib/actions/pdf-generation'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface DepositProofPageProps {
  params: { id: string }
}

async function DepositProofPageContent({ params }: DepositProofPageProps) {
  const { id: bookingId } = params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  // Vérifier que l'utilisateur a accès à ce booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, sender_id, traveler_id, deposited_at')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    notFound()
  }

  if (booking.sender_id !== user.id && booking.traveler_id !== user.id) {
    notFound()
  }

  if (!booking.deposited_at) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Preuve de dépôt"
          description="Document de preuve du dépôt du colis"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Mes colis', href: '/dashboard/colis' },
            { label: 'Preuve de dépôt' },
          ]}
        />
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Le colis n'a pas encore été déposé
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Générer la preuve si elle n'existe pas encore
  let proofResult = await getContractUrl(bookingId, 'deposit')
  if (proofResult.error) {
    proofResult = await generateDepositProof(bookingId)
  }

  const proofUrl = proofResult.url

  return (
    <div className="space-y-6">
      <PageHeader
        title="Preuve de dépôt"
        description="Document de preuve du dépôt du colis"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mes colis', href: '/dashboard/colis' },
          { label: 'Preuve de dépôt' },
        ]}
      />

      {!proofUrl ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Génération de la preuve en cours...
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <a href={proofUrl} download>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger PDF
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ouvrir dans nouvel onglet
                </a>
              </Button>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/colis/${bookingId}`}>Retour</Link>
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <iframe
                src={proofUrl}
                className="w-full h-[800px] border-0 rounded-lg"
                title="Preuve de dépôt"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default function DepositProofPage({ params }: DepositProofPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DepositProofPageContent params={params} />
    </Suspense>
  )
}

