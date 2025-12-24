/**
 * Page affichage contrat de transport PDF
 */

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from "@/lib/shared/db/server"
import { getContractUrl, generateTransportContract } from "@/lib/shared/services/pdf/generation"
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ContractPageProps {
  params: { id: string }
}

async function ContractPageContent({ params }: ContractPageProps) {
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
    .select('id, sender_id, traveler_id, paid_at')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    notFound()
  }

  if (booking.sender_id !== user.id && booking.traveler_id !== user.id) {
    notFound()
  }

  // Générer le contrat s'il n'existe pas encore
  let contractResult = await getContractUrl(bookingId, 'contract')
  if (contractResult.error && booking.paid_at) {
    // Générer le contrat si le paiement est confirmé
    contractResult = await generateTransportContract(bookingId)
  }

  const contractUrl = contractResult.url

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contrat de transport"
        description="Document légal de votre réservation"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mes colis', href: '/dashboard/colis' },
          { label: 'Contrat' },
        ]}
      />

      {!contractUrl ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {booking.paid_at
                ? 'Génération du contrat en cours...'
                : 'Le contrat sera disponible après le paiement'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <a href={contractUrl} download>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger PDF
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={contractUrl} target="_blank" rel="noopener noreferrer">
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
                src={contractUrl}
                className="w-full h-[800px] border-0 rounded-lg"
                title="Contrat de transport"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default function ContractPage({ params }: ContractPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ContractPageContent params={params} />
    </Suspense>
  )
}





