/**
 * Page affichage QR Code pour téléchargement/impression
 */

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from "@/lib/shared/db/server"
import { BookingQRCode } from '@/components/features/bookings/BookingQRCode'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from '@tabler/icons-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from '@tabler/icons-react'

interface QRCodePageProps {
  params: { id: string }
}

async function QRCodePageContent({ params }: QRCodePageProps) {
  const { id: bookingId } = params
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
              <h3 className="font-semibold mb-2">Instructions</h3>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Présentez ce QR code lors du dépôt du colis</li>
                <li>Le QR code sera scanné par le voyageur</li>
                <li>Conservez une copie pour vos archives</li>
                <li>Le même QR code sera utilisé pour la livraison</li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" asChild className="flex-1">
              <Link href={`/dashboard/colis/${bookingId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href={`/dashboard/scan/depot/${bookingId}`}>
                Scanner pour dépôt
              </Link>
            </Button>
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <QRCodePageContent params={params} />
    </Suspense>
  )
}





