/**
 * Composant de signature électronique
 */

'use client'

import { useRef, forwardRef, useImperativeHandle } from 'react'
import SignatureCanvasLib from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { IconRotate } from '@tabler/icons-react'

interface SignatureCanvasProps {
  onSignatureChange?: (isEmpty: boolean) => void
}

export interface SignatureCanvasRef {
  getSignatureDataURL: () => string | null
  getSignatureBlob: () => Promise<Blob | null>
  clear: () => void
  isEmpty: () => boolean
}

export const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  ({ onSignatureChange }, ref) => {
    const signaturePad = useRef<SignatureCanvasLib>(null)

    const dataUrlToBlob = (dataUrl: string) => {
      const [meta, base64] = dataUrl.split(',')
      if (!meta || !base64) return null
      const match = /data:(.*);base64/.exec(meta)
      const mime = match?.[1] || 'image/png'
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i)
      }
      return new Blob([bytes], { type: mime })
    }

    useImperativeHandle(ref, () => ({
      getSignatureDataURL: () => {
        if (!signaturePad.current || signaturePad.current.isEmpty()) {
          return null
        }
        return signaturePad.current.toDataURL('image/png')
      },
      getSignatureBlob: () => {
        if (!signaturePad.current || signaturePad.current.isEmpty()) {
          return Promise.resolve(null)
        }
        const canvas = signaturePad.current.getTrimmedCanvas()
        return new Promise((resolve) => {
          if (!canvas.toBlob) {
            return resolve(dataUrlToBlob(canvas.toDataURL('image/png')))
          }
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
              return
            }
            resolve(dataUrlToBlob(canvas.toDataURL('image/png')))
          }, 'image/png')
        })
      },
      clear: () => {
        signaturePad.current?.clear()
        onSignatureChange?.(true)
      },
      isEmpty: () => {
        return signaturePad.current?.isEmpty() ?? true
      },
    }))

    const handleClear = () => {
      signaturePad.current?.clear()
      onSignatureChange?.(true)
    }

    const handleEnd = () => {
      onSignatureChange?.(signaturePad.current?.isEmpty() ?? true)
    }

    return (
      <div className="space-y-2">
        <Card>
          <CardContent className="pt-6">
            <div className="border-2 border-dashed rounded-lg bg-muted/20">
              <SignatureCanvasLib
                ref={signaturePad}
                canvasProps={{
                  className: 'w-full h-[200px] cursor-crosshair',
                }}
                onEnd={handleEnd}
              />
            </div>
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Signez avec votre doigt ou votre souris
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
              >
                <IconRotate className="mr-2 h-4 w-4" />
                Effacer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
)

SignatureCanvas.displayName = 'SignatureCanvas'







