/**
 * Composant de signature électronique
 */

'use client'

import { useRef, forwardRef, useImperativeHandle } from 'react'
import SignatureCanvasLib from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RotateCcw } from 'lucide-react'

interface SignatureCanvasProps {
  onSignatureChange?: (isEmpty: boolean) => void
}

export interface SignatureCanvasRef {
  getSignatureDataURL: () => string | null
  clear: () => void
  isEmpty: () => boolean
}

export const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  ({ onSignatureChange }, ref) => {
    const signaturePad = useRef<SignatureCanvasLib>(null)

    useImperativeHandle(ref, () => ({
      getSignatureDataURL: () => {
        if (!signaturePad.current || signaturePad.current.isEmpty()) {
          return null
        }
        return signaturePad.current.toDataURL('image/png')
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
                <RotateCcw className="mr-2 h-4 w-4" />
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





