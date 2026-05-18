'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface Props {
  src: string
  alt: string
}

export function KYCProtectedImage({ src, alt }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full relative aspect-video overflow-hidden rounded-lg border bg-muted select-none hover:opacity-90 transition-opacity cursor-zoom-in"
        onContextMenu={e => e.preventDefault()}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          unoptimized
          draggable={false}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-4xl w-full p-2 bg-black/90 border-0"
          onContextMenu={e => e.preventDefault()}
        >
          <div className="relative w-full select-none" style={{ minHeight: '70vh' }}>
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain"
              unoptimized
              draggable={false}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
