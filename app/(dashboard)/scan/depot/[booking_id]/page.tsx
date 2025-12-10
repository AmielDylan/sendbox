/**
 * Page scan QR code pour dépôt de colis
 */

'use client'

import { useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QRScanner } from '@/components/features/bookings/QRScanner'
import { SignaturePad } from '@/components/features/bookings/SignaturePad'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { handleDepositScan, getBookingByQRCode } from '@/lib/actions/qr-scan'
import { toast } from 'sonner'
import { Loader2, Camera, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

type ScanStep = 'scan' | 'photo' | 'signature' | 'confirm'

export default function DepositScanPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.booking_id as string

  const [step, setStep] = useState<ScanStep>('scan')
  const [scannedQRCode, setScannedQRCode] = useState<string | null>(null)
  const [photoDataURL, setPhotoDataURL] = useState<string | null>(null)
  const [signatureDataURL, setSignatureDataURL] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleQRScan = async (qrCode: string) => {
    // Vérifier que le QR code correspond au booking
    const result = await getBookingByQRCode(qrCode)

    if (result.error) {
      toast.error(result.error)
      return
    }

    if (result.booking?.id !== bookingId) {
      toast.error('Ce QR code ne correspond pas à cette réservation')
      return
    }

    setScannedQRCode(qrCode)
    setStep('photo')
    toast.success('QR code scanné avec succès')
  }

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoDataURL(reader.result as string)
      setStep('signature')
    }
    reader.readAsDataURL(file)
  }

  const handleSignatureSave = (dataURL: string) => {
    setSignatureDataURL(dataURL)
    setStep('confirm')
    toast.success('Signature enregistrée')
  }

  const handleConfirm = () => {
    if (!scannedQRCode || !photoDataURL || !signatureDataURL) {
      toast.error('Veuillez compléter toutes les étapes')
      return
    }

    startTransition(async () => {
      const result = await handleDepositScan(
        bookingId,
        scannedQRCode,
        photoDataURL,
        signatureDataURL
      )

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success(result.message)
        router.push(`/dashboard/colis/${bookingId}`)
      }
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dépôt de colis"
        description="Scannez le QR code pour confirmer le dépôt"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mes colis', href: '/dashboard/colis' },
          { label: 'Dépôt' },
        ]}
      />

      {/* Étape 1: Scan QR */}
      {step === 'scan' && (
        <div className="max-w-2xl mx-auto">
          <QRScanner
            onScan={handleQRScan}
            title="Scanner le QR code"
            description="Scannez le QR code de la réservation"
          />
        </div>
      )}

      {/* Étape 2: Photo */}
      {step === 'photo' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="photo">Photo du colis</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Prenez une photo du colis déposé
                  </p>
                </div>
                {photoDataURL && (
                  <div className="mt-4">
                    <Image
                      src={photoDataURL}
                      alt="Photo du colis"
                      width={400}
                      height={300}
                      className="rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Étape 3: Signature */}
      {step === 'signature' && (
        <div className="max-w-2xl mx-auto">
          <SignaturePad
            onSave={handleSignatureSave}
            title="Signature de confirmation"
            description="Signez pour confirmer le dépôt du colis"
          />
        </div>
      )}

      {/* Étape 4: Confirmation */}
      {step === 'confirm' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Toutes les étapes sont complétées</span>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">QR Code scanné :</p>
                  <p className="font-mono text-sm">{scannedQRCode}</p>
                </div>

                {photoDataURL && (
                  <div className="space-y-2">
                    <p className="font-medium">Photo du colis :</p>
                    <Image
                      src={photoDataURL}
                      alt="Photo"
                      width={200}
                      height={150}
                      className="rounded border"
                    />
                  </div>
                )}

                {signatureDataURL && (
                  <div className="space-y-2">
                    <p className="font-medium">Signature :</p>
                    <Image
                      src={signatureDataURL}
                      alt="Signature"
                      width={200}
                      height={100}
                      className="rounded border bg-white"
                    />
                  </div>
                )}

                <Button
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="w-full"
                  size="lg"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirmation en cours...
                    </>
                  ) : (
                    'Confirmer le dépôt'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

