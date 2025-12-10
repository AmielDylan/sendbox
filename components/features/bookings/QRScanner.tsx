/**
 * Composant Scanner QR Code
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserQRCodeReader } from '@zxing/library'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Camera, AlertCircle } from 'lucide-react'

interface QRScannerProps {
  onScan: (code: string) => void
  onError?: (error: string) => void
  title?: string
  description?: string
}

export function QRScanner({
  onScan,
  onError,
  title = 'Scanner QR Code',
  description = 'Placez le QR code devant la caméra',
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null)

  useEffect(() => {
    const startScanning = async () => {
      try {
        // Demander la permission de la caméra
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        setHasPermission(true)
        stream.getTracks().forEach((track) => track.stop()) // Libérer immédiatement pour réutiliser

        if (!videoRef.current) return

        const codeReader = new BrowserQRCodeReader()
        codeReaderRef.current = codeReader

        setIsScanning(true)
        setError(null)

        await codeReader.decodeFromVideoDevice(
          null,
          videoRef.current!,
          (result, err) => {
            if (result) {
              const text = result.getText()
              setIsScanning(false)
              codeReader.reset()
              onScan(text)
            } else if (err && !(err.name === 'NotFoundException')) {
              // NotFoundException est normal quand aucun QR code n'est détecté
              console.error('Scan error:', err)
            }
          }
        )
      } catch (err: any) {
        console.error('Error starting scanner:', err)
        setHasPermission(false)
        setIsScanning(false)
        const errorMessage =
          err.name === 'NotAllowedError'
            ? 'Permission caméra refusée. Veuillez autoriser l\'accès à la caméra.'
            : err.name === 'NotFoundError'
            ? 'Aucune caméra trouvée.'
            : 'Erreur lors de l\'initialisation du scanner.'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    }

    startScanning()

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset()
        codeReaderRef.current = null
      }
    }
  }, [onScan, onError])

  const handleRetry = () => {
    setError(null)
    setHasPermission(null)
    setIsScanning(false)
    // Le useEffect se relancera automatiquement
    window.location.reload()
  }

  if (hasPermission === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRetry} className="mt-4 w-full">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full max-w-md mx-auto rounded-lg border-2 border-gray-200"
            autoPlay
            playsInline
            muted
          />
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-primary rounded-lg w-64 h-64 animate-pulse" />
            </div>
          )}
        </div>
        <p className="text-center text-sm text-muted-foreground">{description}</p>
        {isScanning && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Recherche du QR code...</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

