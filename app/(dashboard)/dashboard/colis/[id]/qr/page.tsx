/**
 * Page affichage QR Code pour téléchargement/impression
 */

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/shared/db/server'
import { BookingQRCode } from '@/components/features/bookings/BookingQRCode'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { IconLoader2 } from '@tabler/icons-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { IconArrowLeft } from '@tabler/icons-react'

interface QRCodePageProps {
  params: Promise<{ id: string }>
}

async function QRCodePageContent({ params }: QRCodePageProps) {
  const { id: bookingId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  // Récupérer le booking avec le QR code
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, qr_code, status, sender_id, traveler_id')
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    notFound()
  }

  // Vérifier que l'utilisateur a accès à ce booking
  if (booking.sender_id !== user.id && booking.traveler_id !== user.id) {
    notFound()
  }

  if (!booking.qr_code) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="QR Code"
          description="QR Code de traçabilité"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Mes colis', href: '/dashboard/colis' },
            { label: 'QR Code' },
          ]}
        />
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              QR code en cours de génération...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isSender = booking.sender_id === user.id
  const isTraveler = booking.traveler_id === user.id

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Code de traçabilité"
        description="Présentez ce QR code lors du dépôt et de la livraison"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mes colis', href: '/dashboard/colis' },
          { label: 'QR Code' },
        ]}
      />

      <div className="max-w-md mx-auto">
        <BookingQRCode qrCode={booking.qr_code} bookingId={booking.id} />

        <div className="mt-6 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">
                {isSender
                  ? "Instructions pour l'expéditeur"
                  : 'Instructions pour le voyageur'}
              </h3>
              {isSender ? (
                <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                  <li>
                    Imprimez ou enregistrez ce QR code sur votre téléphone
                  </li>
                  <li>Présentez-le au voyageur lors de la remise du colis</li>
                  <li>
                    Le voyageur scannera ce code pour confirmer la prise en
                    charge
                  </li>
                  <li>Conservez une copie pour le suivi de votre envoi</li>
                </ul>
              ) : (
                <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                  <li>Scannez ce QR code lors de la récupération du colis</li>
                  <li>
                    Prenez une photo du colis et faites signer l'expéditeur
                  </li>
                  <li>Scannez à nouveau ce code lors de la livraison</li>
                  <li>
                    Prenez une photo de la livraison et faites signer le
                    destinataire
                  </li>
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" asChild className="flex-1">
              <Link href={`/dashboard/colis/${bookingId}`}>
                <IconArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
            </Button>
            {isTraveler && booking.status === 'paid' && (
              <Button asChild className="flex-1">
                <Link href={`/dashboard/scan/depot/${bookingId}`}>
                  Scanner pour dépôt
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function QRCodePage({ params }: QRCodePageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <QRCodePageContent params={params} />
    </Suspense>
  )
}
