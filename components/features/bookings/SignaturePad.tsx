/**
 * Composant Canvas pour signature
 */

'use client'

import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconTrash, IconCheck } from '@tabler/icons-react'

interface SignaturePadProps {
  onSave: (dataURL: string) => void
  title?: string
  description?: string
}

export function SignaturePad({
  onSave,
  title = 'Signature',
  description = 'Signez dans le cadre ci-dessous',
}: SignaturePadProps) {
  const sigCanvasRef = useRef<SignatureCanvas>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  const handleClear = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear()
      setIsEmpty(true)
    }
  }

  const handleSave = () => {
    if (sigCanvasRef.current && !isEmpty) {
      const dataURL = sigCanvasRef.current.toDataURL('image/png')
      onSave(dataURL)
    }
  }

  const handleBegin = () => {
    setIsEmpty(false)
  }

  const handleEnd = () => {
    if (sigCanvasRef.current) {
      const isEmpty = sigCanvasRef.current.isEmpty()
      setIsEmpty(isEmpty)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
          <SignatureCanvas
            ref={sigCanvasRef}
            canvasProps={{
              className: 'w-full',
              width: 600,
              height: 200,
            }}
            onBegin={handleBegin}
            onEnd={handleEnd}
            backgroundColor="white"
            penColor="#000000"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleClear} variant="outline" className="flex-1">
            <IconTrash className="mr-2 h-4 w-4" />
            Effacer
          </Button>
          <Button onClick={handleSave} disabled={isEmpty} className="flex-1">
            <IconCheck className="mr-2 h-4 w-4" />
            Valider la signature
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}











