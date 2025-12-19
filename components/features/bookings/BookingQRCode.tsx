/**
 * Composant pour afficher le QR code d'une réservation
 */

'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Printer } from 'lucide-react'
import { toast } from 'sonner'

interface BookingQRCodeProps {
  qrCode: string
  bookingId: string
}

export function BookingQRCode({ qrCode, bookingId }: BookingQRCodeProps) {
  const [qrDataURL, setQrDataURL] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(true)

  useEffect(() => {
    if (!qrCode) return

    QRCode.toDataURL(qrCode, {
      width: 300,
      margin: 2,
      color: {
        dark: '#0d5554',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((dataURL) => {
        setQrDataURL(dataURL)
        setIsGenerating(false)
      })
      .catch((error) => {
        console.error('Error generating QR code:', error)
        toast.error('Erreur lors de la génération du QR code')
        setIsGenerating(false)
      })
  }, [qrCode])

  const handleDownloadQR = () => {
    if (!qrDataURL) return

    const link = document.createElement('a')
    link.download = `sendbox-qr-${bookingId}.png`
    link.href = qrDataURL
    link.click()
  }

  const handlePrintQR = () => {
    if (!qrDataURL) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Impossible d\'ouvrir la fenêtre d\'impression')
      return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${qrCode}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            .code {
              font-family: monospace;
              font-size: 24px;
              margin-top: 20px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <img src="${qrDataURL}" alt="QR Code" />
          <div class="code">${qrCode}</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  if (isGenerating) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Génération du QR code...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code de traçabilité</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          {qrDataURL && (
            <img
              src={qrDataURL}
              alt="QR Code"
              className="mx-auto border-2 border-gray-200 rounded-lg p-4 bg-white"
            />
          )}
          <p className="mt-4 font-mono text-lg font-semibold">{qrCode}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Présentez ce QR code lors du dépôt et de la livraison
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={handleDownloadQR} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Télécharger
          </Button>
          <Button onClick={handlePrintQR} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}





