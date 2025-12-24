/**
 * Composant d'affichage du QR code d'un booking
 */

'use client'

import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconDownload, Printer } from '@tabler/icons-react'
import { toast } from 'sonner'

interface BookingQRCodeProps {
  qrCode: string
  bookingId: string
}

export function BookingQRCode({ qrCode, bookingId }: BookingQRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null)

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) {
      toast.error('Impossible de télécharger le QR code')
      return
    }

    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `qr-code-${bookingId}.png`
    link.href = url
    link.click()
    toast.success('QR code téléchargé')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div ref={qrRef} className="flex justify-center p-6 bg-white rounded-lg">
            <QRCodeCanvas
            value={qrCode}
            size={256}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm font-medium">Code: {qrCode}</p>
          <p className="text-xs text-muted-foreground">
            Réservation #{bookingId.slice(0, 8)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Télécharger
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
