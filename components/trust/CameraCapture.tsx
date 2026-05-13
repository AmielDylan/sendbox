'use client'

import { useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { IconCamera, IconLoader2, IconX } from '@tabler/icons-react'

interface CameraCaptureProps {
  onCapture: (file: File, previewUrl: string) => void
  disabled?: boolean
  label?: string
}

export function CameraCapture({ onCapture, disabled, label = 'Prendre une photo' }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openCamera = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsOpen(true)
    } catch {
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setIsOpen(false)
  }, [])

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(blob => {
      if (!blob) return
      // capturedAt généré côté serveur uniquement — ce timestamp n'est pas transmis
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
      const previewUrl = URL.createObjectURL(blob)
      onCapture(file, previewUrl)
      closeCamera()
    }, 'image/jpeg', 0.85)
  }, [onCapture, closeCamera])

  return (
    <div className="space-y-2">
      {!isOpen ? (
        <Button
          type="button"
          variant="outline"
          onClick={openCamera}
          disabled={disabled || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <IconCamera className="mr-2 h-4 w-4" />
          )}
          {label}
        </Button>
      ) : (
        <div className="relative rounded-lg overflow-hidden border bg-black">
          <video ref={videoRef} className="w-full" autoPlay playsInline muted />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <Button type="button" onClick={capture} size="lg">
              <IconCamera className="mr-2 h-4 w-4" />
              Capturer
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={closeCamera} className="text-white hover:bg-white/20">
              <IconX className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
